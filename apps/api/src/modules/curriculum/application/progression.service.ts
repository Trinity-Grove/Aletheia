import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { evidenceCountRulesSchema, type ProgressionEvaluationQueryDto, type ProgressionEvaluationResponseDto } from '@aletheia/contracts';
import { ProgressionRepository } from '../infrastructure/progression.repository.js';

export interface Definition { id: string; version: number; status: string; schemaVersion: string }
export interface Policy extends Definition {
  policyType: string;
  rules: unknown;
  competencyDefinitionId: string | null;
  curriculumDefinitionId: string | null;
}
export interface ProgressionTracking {
  id: string;
  learnerId: string;
  competencyDefinitionId: string;
  competencyVersion: number;
  curriculumDefinitionId: string | null;
  status: 'ACTIVE' | 'RETIRED';
}
export interface ProgressionReader {
  learnerExists(familyId: string, learnerId: string): Promise<boolean>;
  tracking(familyId: string, id: string): Promise<ProgressionTracking | null>;
  trackingForCompetency(familyId: string, learnerId: string, competencyId: string): Promise<ProgressionTracking | null>;
  competency(id: string): Promise<Definition | null>;
  policy(id: string): Promise<Policy | null>;
  curriculumContains(curriculumId: string, competencyId: string): Promise<boolean>;
  evidenceCount(familyId: string, learnerId: string, competencyId: string, version: number): Promise<number>;
  trackingPolicy?(familyId: string, trackingId: string): Promise<{ id: string; version: number } | null>;
  requireTrackingPolicyBinding?: boolean;
}

// A request evaluates at most 64 distinct competency/policy pairs, 16 levels deep.
// The repository supplies one database snapshot for the whole traversal.
export async function evaluateProgression(reader: ProgressionReader, familyId: string, query: ProgressionEvaluationQueryDto): Promise<ProgressionEvaluationResponseDto> {
  const root = await reader.tracking(familyId, query.trackingId);
  if (!root || !await reader.learnerExists(familyId, root.learnerId)) throw new NotFoundException('Tracked competency not found');
  const visiting = new Set<string>();
  const results = new Map<string, ProgressionEvaluationResponseDto>();
  let visited = 0;
  async function evaluate(tracking: ProgressionTracking, policyId: string, depth: number): Promise<ProgressionEvaluationResponseDto> {
    const competencyId = tracking.competencyDefinitionId;
    const pinnedPolicy = await reader.trackingPolicy?.(familyId, tracking.id);
    if (reader.requireTrackingPolicyBinding && !pinnedPolicy) throw new BadRequestException('Automatic progression requires a policy binding for every tracked prerequisite');
    if (pinnedPolicy && pinnedPolicy.id !== policyId) throw new BadRequestException('Progression prerequisite policy does not match the tracking binding');
    const effectivePolicyId = pinnedPolicy?.id ?? policyId;
    const key = `${tracking.id}:${effectivePolicyId}`;
    if (visiting.has(key)) throw new BadRequestException('Progression prerequisite cycle');
    const cached = results.get(key);
    if (cached) return cached;
    if (depth > 16 || ++visited > 64) throw new BadRequestException('Progression traversal limit exceeded');
    visiting.add(key);
    const competency = await reader.competency(competencyId);
    const policy = await reader.policy(effectivePolicyId);
    if (!competency || !policy) throw new NotFoundException('Progression definition not found');
    // Previously activated versions remain usable after deprecation/archival.
    // Policies are selected now, not pinned by tracking, so must still be published.
    if (!['PUBLISHED', 'DEPRECATED', 'ARCHIVED'].includes(competency.status) || competency.version !== tracking.competencyVersion ||
        competency.schemaVersion !== '1.0.0' || (pinnedPolicy ? !['PUBLISHED', 'DEPRECATED', 'ARCHIVED'].includes(policy.status) : policy.status !== 'PUBLISHED') || policy.schemaVersion !== '1.0.0' ||
        (pinnedPolicy && policy.version !== pinnedPolicy.version)) {
      throw new BadRequestException('Progression requires a supported tracked competency version and a published supported policy');
    }
    if (policy.policyType !== 'EVIDENCE_COUNT') throw new BadRequestException('Unsupported progression policy type');
    const parsed = evidenceCountRulesSchema.safeParse(policy.rules);
    if (!parsed.success) throw new BadRequestException('Invalid EVIDENCE_COUNT rules');
    if (policy.competencyDefinitionId && policy.competencyDefinitionId !== competencyId) throw new BadRequestException('Progression policy competency scope mismatch');
    if (policy.curriculumDefinitionId && policy.curriculumDefinitionId !== tracking.curriculumDefinitionId) {
      throw new BadRequestException('Progression policy curriculum scope differs from the activated curriculum');
    }
    if (tracking.curriculumDefinitionId && !await reader.curriculumContains(tracking.curriculumDefinitionId, competencyId)) {
      throw new BadRequestException('Activated curriculum must contain this exact competency and use a supported non-draft definition');
    }
    const prerequisites: ProgressionEvaluationResponseDto[] = [];
    for (const prerequisite of parsed.data.prerequisites) {
      const prerequisiteTracking = await reader.trackingForCompetency(familyId, root!.learnerId, prerequisite.competencyDefinitionId);
      if (!prerequisiteTracking || prerequisiteTracking.learnerId !== root!.learnerId) throw new NotFoundException('Prerequisite is not tracked for this learner');
      prerequisites.push(await evaluate(prerequisiteTracking, prerequisite.policyId, depth + 1));
    }
    const unmetPrerequisites = prerequisites.filter((result) => result.state !== 'MASTERED').map(({ learnerId: _learnerId, unmetPrerequisites: _nested, ...result }) => result);
    const count = await reader.evidenceCount(familyId, root!.learnerId, competencyId, tracking.competencyVersion);
    const result: ProgressionEvaluationResponseDto = {
      learnerId: root!.learnerId, competencyDefinitionId: competencyId, competencyVersion: tracking.competencyVersion,
      trackingId: tracking.id, trackingStatus: tracking.status, curriculumDefinitionId: tracking.curriculumDefinitionId,
      policyId: effectivePolicyId, policyVersion: policy.version, validatedEvidenceCount: count,
      minimumEvidenceCount: parsed.data.minimumEvidenceCount, unmetPrerequisites,
      state: unmetPrerequisites.length ? 'BLOCKED' : count >= parsed.data.minimumEvidenceCount ? 'MASTERED' : count > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
    };
    visiting.delete(key);
    results.set(key, result);
    return result;
  }
  return evaluate(root, query.policyId, 0);
}

@Injectable()
export class ProgressionService {
  constructor(private readonly repository: ProgressionRepository) {}

  evaluate(familyId: string, query: ProgressionEvaluationQueryDto): Promise<ProgressionEvaluationResponseDto> {
    return this.repository.snapshot((reader) => evaluateProgression(reader, familyId, query));
  }
}
