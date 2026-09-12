import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { evidenceCountRulesSchema, type ProgressionEvaluationQueryDto, type ProgressionEvaluationResponseDto } from '@aletheia/contracts';
import { ProgressionRepository } from '../infrastructure/progression.repository.js';

interface Definition { id: string; version: number; status: string; schemaVersion: string }
interface Policy extends Definition {
  policyType: string;
  rules: unknown;
  competencyDefinitionId: string | null;
  curriculumDefinitionId: string | null;
}
export interface ProgressionReader {
  learnerExists(familyId: string, learnerId: string): Promise<boolean>;
  competency(id: string): Promise<Definition | null>;
  policy(id: string): Promise<Policy | null>;
  curriculumContains(curriculumId: string, competencyId: string): Promise<boolean>;
  evidenceCount(familyId: string, learnerId: string, competencyId: string, version: number): Promise<number>;
}

// A request evaluates at most 64 distinct competency/policy pairs, 16 levels deep.
// The repository supplies one database snapshot for the whole traversal.
export async function evaluateProgression(reader: ProgressionReader, familyId: string, query: ProgressionEvaluationQueryDto): Promise<ProgressionEvaluationResponseDto> {
  if (!await reader.learnerExists(familyId, query.learnerId)) throw new NotFoundException('Learner not found');
  const visiting = new Set<string>();
  const results = new Map<string, ProgressionEvaluationResponseDto>();
  let visited = 0;
  async function evaluate(competencyId: string, policyId: string, depth: number): Promise<ProgressionEvaluationResponseDto> {
    const key = `${competencyId}:${policyId}`;
    if (visiting.has(key)) throw new BadRequestException('Progression prerequisite cycle');
    const cached = results.get(key);
    if (cached) return cached;
    if (depth > 16 || ++visited > 64) throw new BadRequestException('Progression traversal limit exceeded');
    visiting.add(key);
    const competency = await reader.competency(competencyId);
    const policy = await reader.policy(policyId);
    if (!competency || !policy) throw new NotFoundException('Progression definition not found');
    if ([competency, policy].some((definition) => definition.status !== 'PUBLISHED' || definition.schemaVersion !== '1.0.0')) {
      throw new BadRequestException('Progression requires published definitions with supported schema version 1.0.0');
    }
    if (policy.policyType !== 'EVIDENCE_COUNT') throw new BadRequestException('Unsupported progression policy type');
    const parsed = evidenceCountRulesSchema.safeParse(policy.rules);
    if (!parsed.success) throw new BadRequestException('Invalid EVIDENCE_COUNT rules');
    if (policy.competencyDefinitionId && policy.competencyDefinitionId !== competencyId) throw new BadRequestException('Progression policy competency scope mismatch');
    if (policy.curriculumDefinitionId && !await reader.curriculumContains(policy.curriculumDefinitionId, competencyId)) {
      throw new BadRequestException('Progression policy requires a published supported curriculum containing this exact competency');
    }
    const prerequisites: ProgressionEvaluationResponseDto[] = [];
    for (const prerequisite of parsed.data.prerequisites) {
      prerequisites.push(await evaluate(prerequisite.competencyDefinitionId, prerequisite.policyId, depth + 1));
    }
    const unmetPrerequisites = prerequisites.filter((result) => result.state !== 'MASTERED').map(({ learnerId: _learnerId, unmetPrerequisites: _nested, ...result }) => result);
    const count = await reader.evidenceCount(familyId, query.learnerId, competencyId, competency.version);
    const result: ProgressionEvaluationResponseDto = {
      learnerId: query.learnerId, competencyDefinitionId: competencyId, competencyVersion: competency.version,
      policyId, policyVersion: policy.version, validatedEvidenceCount: count,
      minimumEvidenceCount: parsed.data.minimumEvidenceCount, unmetPrerequisites,
      state: unmetPrerequisites.length ? 'BLOCKED' : count >= parsed.data.minimumEvidenceCount ? 'MASTERED' : count > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
    };
    visiting.delete(key);
    results.set(key, result);
    return result;
  }
  return evaluate(query.competencyDefinitionId, query.policyId, 0);
}

@Injectable()
export class ProgressionService {
  constructor(private readonly repository: ProgressionRepository) {}

  evaluate(familyId: string, query: ProgressionEvaluationQueryDto): Promise<ProgressionEvaluationResponseDto> {
    return this.repository.snapshot((reader) => evaluateProgression(reader, familyId, query));
  }
}
