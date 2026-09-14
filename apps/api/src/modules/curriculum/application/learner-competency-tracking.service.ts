import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { evidenceCountRulesSchema } from '@aletheia/contracts';
import type {
  ActivateCurriculumForLearnerDto,
  ActivateCurriculumForLearnerResultDto,
  LearnerCompetencyTrackingResponseDto,
} from '@aletheia/contracts';
import {
  LearnerCompetencyTrackingRepository,
  type LearnerCompetencyTrackingWithCompetency,
} from '../infrastructure/learner-competency-tracking.repository.js';
import { AchievementRepository } from '../infrastructure/achievement.repository.js';

// Activates a CurriculumDefinition for a learner (issue #126 item 3) --
// this is the piece that was missing: CurriculumService.applyTemplate
// only ever created old-style Subject/LearningObjective rows, even for a
// catalog-based pedagogical model, so nothing in the live product
// actually produced CompetencyDefinition-linked data. Activating fans out
// over the curriculum's CurriculumDefinitionCompetency joins and creates
// one LearnerCompetencyTracking row per competency, snapshotting the
// exact competency version reached through that curriculum at the moment
// of activation.
//
// This is additive, standalone functionality -- it does NOT replace or
// call applyTemplate. A family can activate a curriculum for competency
// tracking independently of (or alongside) the existing
// Subject/LearningObjective-based plan, per the human's explicit
// instruction not to retire/hide the old flow in this slice.
//
// Same defense-in-depth tenant check as EvidenceSubmissionService: the
// FamilyTenantGuard only proves the caller belongs to the family in the
// URL, not that a learnerId in the request body wasn't spoofed to point
// at a different family's learner.
@Injectable()
export class LearnerCompetencyTrackingService {
  constructor(private readonly repository: LearnerCompetencyTrackingRepository, private readonly achievementRepository: AchievementRepository) {}

  async activateCurriculumForLearner(
    familyId: string,
    dto: ActivateCurriculumForLearnerDto,
    actorId?: string,
  ): Promise<ActivateCurriculumForLearnerResultDto> {
    const learnerFamilyId = await this.repository.findLearnerFamilyId(dto.learnerId);
    if (!learnerFamilyId || learnerFamilyId !== familyId) {
      throw new NotFoundException('Learner not found in this family.');
    }

    const competencies = await this.repository.findCurriculumDefinitionCompetencies(
      dto.curriculumDefinitionId,
    );
    if (!competencies) {
      throw new NotFoundException('Curriculum definition not found.');
    }
    if (competencies.length === 0) {
      throw new BadRequestException(
        'This curriculum definition has no competencies to activate -- add at least one before activating it for a learner.',
      );
    }

    let policy: { id: string; version: number } | null = null;
    if (dto.progressionPolicyId) {
      const policyRow = await this.repository.findProgressionPolicy(dto.progressionPolicyId);
      if (!policyRow || policyRow.status !== 'PUBLISHED' || policyRow.schemaVersion !== '1.0.0' || policyRow.policyType !== 'EVIDENCE_COUNT') {
        throw new BadRequestException('Automatic achievements require a published supported EVIDENCE_COUNT policy.');
      }
      const parsedRules = evidenceCountRulesSchema.safeParse(policyRow.rules);
      if (!parsedRules.success) throw new BadRequestException('The progression policy has invalid EVIDENCE_COUNT rules.');
      if (policyRow.curriculumDefinitionId && policyRow.curriculumDefinitionId !== dto.curriculumDefinitionId) {
        throw new BadRequestException('The progression policy is scoped to a different curriculum.');
      }
      if (policyRow.competencyDefinitionId && competencies.some((c) => c.competencyDefinitionId !== policyRow.competencyDefinitionId)) {
        throw new BadRequestException('A competency-scoped policy can only activate its competency.');
      }
      policy = { id: policyRow.id, version: policyRow.version };
    }

    const existingKeys = await this.repository.findExistingTrackingKeys(
      dto.learnerId,
      competencies.map((c) => c.competencyDefinitionId),
    );
    const toCreate = competencies.filter(
      (c) => !existingKeys.has(`${c.competencyDefinitionId}:${c.competencyVersion}`),
    );

    // Idempotent by design (issue #126 item 3's instruction to make
    // "applying a curriculum" a real, safe, repeatable action): the
    // unique constraint on [learnerId, competencyDefinitionId,
    // competencyVersion] means re-activating the same curriculum for the
    // same learner never duplicates tracking rows.
    await this.repository.createMany(familyId, dto.learnerId, dto.curriculumDefinitionId, toCreate, policy);

    const allRows = await this.repository.findByLearnerAndCompetencies(
      dto.learnerId,
      competencies.map((c) => c.competencyDefinitionId),
    );
    // Restrict the returned set to exactly the versions this curriculum
    // referenced (a learner could already be tracking a *different*
    // version of one of these competencies from an earlier activation --
    // that row is untouched and simply not part of this result).
    const relevantVersions = new Set(
      competencies.map((c) => `${c.competencyDefinitionId}:${c.competencyVersion}`),
    );
    const relevantRows = allRows.filter((row) =>
      relevantVersions.has(`${row.competencyDefinitionId}:${row.competencyVersion}`),
    );
    if (policy) {
      const existingRows = await this.repository.findByLearnerAndCompetencies(dto.learnerId, competencies.map((c) => c.competencyDefinitionId));
      const relevantVersions = new Set(competencies.map((c) => `${c.competencyDefinitionId}:${c.competencyVersion}`));
      for (const row of existingRows.filter((candidate) => relevantVersions.has(`${candidate.competencyDefinitionId}:${candidate.competencyVersion}`))) {
        if (row.progressionPolicyId !== policy.id || row.policyVersion !== policy.version) {
          throw new BadRequestException('This tracking already has a different immutable progression policy binding.');
        }
      }
    }

    for (const row of relevantRows) {
      const rowPolicy = row.progressionPolicyId ? { id: row.progressionPolicyId, version: row.policyVersion } : null;
      if (policy && (!rowPolicy || rowPolicy.id !== policy.id || rowPolicy.version !== policy.version)) {
        throw new BadRequestException('This tracking already has a different immutable progression policy binding.');
      }
      if (!policy && rowPolicy) {
        // An idempotent legacy activation may read a tracking that was already
        // bound by an earlier request; its binding is returned unchanged.
      }
    }
    if (actorId && policy) await this.achievementRepository.reconcileValidatedEvidence(familyId, dto.learnerId, actorId);

    return {
      createdCount: toCreate.length,
      alreadyActiveCount: competencies.length - toCreate.length,
      trackings: relevantRows.map((row) => this.toDto(row)),
    };
  }

  async listTrackedCompetencies(
    familyId: string,
    learnerId?: string,
    status?: 'ACTIVE' | 'RETIRED',
  ): Promise<LearnerCompetencyTrackingResponseDto[]> {
    const rows = await this.repository.list(familyId, learnerId, status);
    return rows.map((row) => this.toDto(row));
  }

  async retireTrackedCompetency(familyId: string, id: string): Promise<LearnerCompetencyTrackingResponseDto> {
    const existing = await this.repository.findById(familyId, id);
    if (!existing) throw new NotFoundException('Tracked competency not found.');
    const updated = await this.repository.retire(id);
    return this.toDto(updated);
  }

  private toDto(row: LearnerCompetencyTrackingWithCompetency): LearnerCompetencyTrackingResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      learnerId: row.learnerId,
      competencyDefinitionId: row.competencyDefinitionId,
      competencyVersion: row.competencyVersion,
      curriculumDefinitionId: row.curriculumDefinitionId,
      progressionPolicyId: row.progressionPolicyId,
      policyVersion: row.policyVersion,
      status: row.status,
      activatedAt: row.activatedAt.toISOString(),
      retiredAt: row.retiredAt ? row.retiredAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      competency: {
        code: row.competencyDefinition.code,
        title: row.competencyDefinition.title,
        domainId: row.competencyDefinition.domainId,
        domainTitle: row.competencyDefinition.domain.name,
      },
    };
  }
}
