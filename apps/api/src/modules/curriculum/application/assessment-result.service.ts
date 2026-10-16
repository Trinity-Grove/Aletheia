import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AssessmentResultResponseDto, CreateAssessmentResultOutput } from '@aletheia/contracts';
import {
  AssessmentResultRepository,
  type AssessmentResultWithScores,
} from '../infrastructure/assessment-result.repository.js';

// Family-scoped assessment result workflow (issue #96 Fase 2, section
// 10's last item: "resultado guarda qual versão foi usada"). Can stand
// alone (no evidence submission) for e.g. a pure self-assessment.
// `assessorType` is free-form -- not validated against a closed list, by
// design, per the issue's own anti-hardcode principle.
@Injectable()
export class AssessmentResultService {
  constructor(private readonly repository: AssessmentResultRepository) {}

  async createAssessmentResult(
    familyId: string,
    trustedActorUserId: string,
    dto: CreateAssessmentResultOutput,
  ): Promise<AssessmentResultResponseDto> {
    if (!trustedActorUserId) throw new BadRequestException('Authenticated assessor is required.');
    if (dto.assessorUserId && dto.assessorUserId !== trustedActorUserId) {
      throw new BadRequestException('assessorUserId must match the authenticated user.');
    }
    const learnerFamilyId = await this.repository.findLearnerFamilyId(dto.learnerId);
    if (!learnerFamilyId || learnerFamilyId !== familyId) {
      throw new NotFoundException('Learner not found in this family.');
    }

    if (dto.evidenceSubmissionId) {
      const evidenceFamilyId = await this.repository.findEvidenceSubmissionFamilyId(dto.evidenceSubmissionId);
      if (!evidenceFamilyId || evidenceFamilyId !== familyId) {
        throw new NotFoundException('Evidence submission not found in this family.');
      }
    }

    const rubricVersion = await this.repository.findRubricDefinitionVersion(dto.rubricDefinitionId);
    if (rubricVersion === null) {
      throw new BadRequestException('Rubric definition does not exist.');
    }

    const validCriterionIds = await this.repository.findRubricCriterionIdsForRubric(dto.rubricDefinitionId);
    const invalidCriterionIds = dto.scores
      .map((s) => s.rubricCriterionId)
      .filter((id) => !validCriterionIds.has(id));
    if (invalidCriterionIds.length > 0) {
      throw new BadRequestException(
        `One or more scored criteria do not belong to this rubric: ${invalidCriterionIds.join(', ')}.`,
      );
    }

    const created = await this.repository.create({
      familyId,
      learnerId: dto.learnerId,
      evidenceSubmissionId: dto.evidenceSubmissionId,
      rubricDefinitionId: dto.rubricDefinitionId,
      // Snapshot the version at assessment time -- the exact point of
      // this table: "resultado guarda qual versão foi usada" survives a
      // later rubric version bump (a bump creates a *new* RubricDefinition
      // row; this result keeps pointing at the original one).
      rubricVersion,
      assessorType: dto.assessorType,
      assessorUserId: trustedActorUserId,
      notes: dto.notes,
      scores: dto.scores,
    });

    return this.toDto(created);
  }

  async listAssessmentResults(familyId: string, learnerId?: string): Promise<AssessmentResultResponseDto[]> {
    const rows = await this.repository.list(familyId, learnerId);
    return rows.map((row) => this.toDto(row));
  }

  async getAssessmentResult(familyId: string, id: string): Promise<AssessmentResultResponseDto> {
    const row = await this.repository.findById(familyId, id);
    if (!row) throw new NotFoundException('Assessment result not found.');
    return this.toDto(row);
  }

  private toDto(row: AssessmentResultWithScores): AssessmentResultResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      learnerId: row.learnerId,
      evidenceSubmissionId: row.evidenceSubmissionId,
      rubricDefinitionId: row.rubricDefinitionId,
      rubricVersion: row.rubricVersion,
      assessorType: row.assessorType,
      assessorUserId: row.assessorUserId,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
      scores: row.scores.map((s) => ({
        id: s.id,
        assessmentResultId: s.assessmentResultId,
        rubricCriterionId: s.rubricCriterionId,
        score: s.score,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }
}
