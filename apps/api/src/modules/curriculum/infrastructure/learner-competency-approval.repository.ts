import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type LearnerCompetencyApprovalEvent } from '@prisma/client';
import type { LearnerCompetencyApprovalDecisionDto } from '@aletheia/contracts';
import { evaluateProgression, parseProgressionPolicyRules } from '../application/progression.service.js';
import { AchievementRepository } from './achievement.repository.js';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { createPrismaProgressionReader, progressionApprovalOptions } from './prisma-progression-reader.js';

@Injectable()
export class LearnerCompetencyApprovalRepository {
  constructor(private readonly prisma: PrismaService, private readonly achievements: AchievementRepository) {}

  findApprovalTrackingScope(trackingId: string): Promise<{ familyId: string; learnerId: string } | null> {
    return this.prisma.learnerCompetencyTracking.findUnique({ where: { id: trackingId }, select: { familyId: true, learnerId: true } });
  }

  recordDecision(familyId: string, trackingId: string, actorUserId: string, decision: LearnerCompetencyApprovalDecisionDto, authorizedMentorUserId?: string): Promise<LearnerCompetencyApprovalEvent> {
    return this.prisma.$transaction(async (tx) => {
      if (authorizedMentorUserId) {
        const target = await tx.learnerCompetencyTracking.findFirst({ where: { id: trackingId, familyId }, select: { learnerId: true } });
        if (!target) throw new NotFoundException('Approval scope not found');
        const grants = await tx.$queryRaw<{ id: string }[]>`
          SELECT id FROM mentor_grants
          WHERE mentor_user_id = ${authorizedMentorUserId}::uuid
            AND family_id = ${familyId}::uuid
            AND learner_id = ${target.learnerId}::uuid
            AND status = 'ACCEPTED'
            AND can_approve_progression = true
            AND revoked_at IS NULL
            AND expires_at > clock_timestamp()
          LIMIT 1 FOR UPDATE`;
        if (!grants.length) throw new NotFoundException('Approval scope not found');
      }
      // Serialize same-family key use across different learners as well as same-learner races.
      await tx.$queryRaw<{ locked: number }[]>`WITH lock_acquired AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtextextended(${`${familyId}:${decision.idempotencyKey}`}, 0))
      ) SELECT 1::int AS locked FROM lock_acquired`;
      const replay = await tx.learnerCompetencyApprovalEvent.findUnique({ where: { familyId_idempotencyKey: { familyId, idempotencyKey: decision.idempotencyKey } } });
      if (replay) {
        if (replay.actorUserId !== actorUserId || replay.trackingId !== trackingId || replay.decision !== decision.decision || replay.reason !== (decision.reason ?? null)) {
          throw new ConflictException('Idempotency key was already used for a different actor or decision');
        }
        return replay;
      }

      const beforeLock = await tx.learnerCompetencyTracking.findFirst({ where: { id: trackingId, familyId }, select: { learnerId: true } });
      if (!beforeLock) throw new NotFoundException('Tracked competency not found');
      const locked = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM learners WHERE id = ${beforeLock.learnerId}::uuid AND family_id = ${familyId}::uuid FOR UPDATE`;
      if (!locked.length) throw new NotFoundException('Tracked competency not found');
      const tracking = await tx.learnerCompetencyTracking.findFirst({ where: { id: trackingId, familyId, learnerId: beforeLock.learnerId } });
      if (!tracking?.progressionPolicyId || !tracking.policyVersion) throw new BadRequestException('Human approval requires a policy pinned to this tracking');
      const reader = createPrismaProgressionReader(tx, true);
      const query = { trackingId, policyId: tracking.progressionPolicyId };
      const evaluation = await evaluateProgression(reader, familyId, query, progressionApprovalOptions(reader, familyId));
      if (evaluation.state !== 'AWAITING_APPROVAL') throw new ConflictException('Approval is allowed only while all objective gates are satisfied and approval is pending');
      const policy = await reader.policy(tracking.progressionPolicyId);
      if (!policy || policy.version !== tracking.policyVersion) throw new ConflictException('Pinned progression policy version no longer matches');
      const rules = parseProgressionPolicyRules(policy);
      const assessment = 'rubricDefinitionId' in rules
        ? await reader.latestAssessmentResult(familyId, tracking.learnerId, rules.rubricDefinitionId, rules.rubricVersion)
        : null;
      const clock = await tx.$queryRaw<{ now: Date }[]>`SELECT clock_timestamp() AS now`;
      const event = await tx.learnerCompetencyApprovalEvent.create({ data: {
        familyId, learnerId: tracking.learnerId, trackingId,
        competencyDefinitionId: tracking.competencyDefinitionId, competencyVersion: tracking.competencyVersion,
        progressionPolicyId: tracking.progressionPolicyId, policyVersion: tracking.policyVersion,
        assessmentResultId: assessment?.id ?? null, decision: decision.decision, reason: decision.reason ?? null,
        actorUserId, idempotencyKey: decision.idempotencyKey, createdAt: clock[0]!.now,
      } });

      if (decision.decision === 'APPROVED') {
        const approved = await evaluateProgression(reader, familyId, query, progressionApprovalOptions(reader, familyId));
        if (approved.state !== 'MASTERED') throw new ConflictException('Approval event did not satisfy the final progression gate');
        await this.achievements.createAchievementWithinTransaction(tx, familyId, actorUserId, approved, reader, { id: event.id, actorUserId: event.actorUserId, createdAt: event.createdAt, decision: 'APPROVED' });
      }
      return event;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 20_000 });
  }
}
