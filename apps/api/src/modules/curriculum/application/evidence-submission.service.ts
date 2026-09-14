import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateEvidenceSubmissionOutput,
  EvidenceSubmissionResponseDto,
  EvidenceValidationStatus,
} from '@aletheia/contracts';
import {
  EvidenceSubmissionRepository,
  type EvidenceSubmissionWithCompetencies,
} from '../infrastructure/evidence-submission.repository.js';
import { AchievementRepository } from '../infrastructure/achievement.repository.js';

// Family-scoped evidence submission workflow (issue #96 Fase 2, section
// 9). Deliberately NOT wired into LearningObjective/LearningRecord --
// that unification is a separate, human-approved product decision.
//
// Every write here defense-in-depth-checks that the target learner
// actually belongs to the family in the URL (FamilyTenantGuard only
// proves the caller is a member of that family, not that a learnerId in
// the request body wasn't spoofed to point at a different family's
// learner).
@Injectable()
export class EvidenceSubmissionService {
  constructor(private readonly repository: EvidenceSubmissionRepository, private readonly achievementRepository: AchievementRepository) {}

  async createEvidenceSubmission(
    familyId: string,
    authorId: string,
    dto: CreateEvidenceSubmissionOutput,
  ): Promise<EvidenceSubmissionResponseDto> {
    const learnerFamilyId = await this.repository.findLearnerFamilyId(dto.learnerId);
    if (!learnerFamilyId || learnerFamilyId !== familyId) {
      throw new NotFoundException('Learner not found in this family.');
    }

    const competencyIds = dto.competencies.map((c) => c.competencyDefinitionId);
    const versionsById = await this.repository.findCompetencyDefinitionVersionsByIds(competencyIds);
    const missing = competencyIds.filter((id) => !versionsById.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `One or more referenced competency definitions do not exist: ${missing.join(', ')}.`,
      );
    }

    const created = await this.repository.create({
      familyId,
      learnerId: dto.learnerId,
      evidenceTypeId: dto.evidenceTypeId,
      authorId,
      textContent: dto.textContent,
      fileUrl: dto.fileUrl,
      storageKey: dto.storageKey,
      mimeType: dto.mimeType,
      fileSizeBytes: dto.fileSizeBytes,
      checksumSha256: dto.checksumSha256,
      competencies: dto.competencies.map((c) => ({
        competencyDefinitionId: c.competencyDefinitionId,
        // Snapshot the version at submission time -- this is what makes
        // "evidência referencia versão da competência avaliada" survive
        // a later competency version bump (a bump creates a *new*
        // CompetencyDefinition row; this join keeps pointing at the
        // original one).
        competencyVersion: versionsById.get(c.competencyDefinitionId)!,
      })),
    });

    return this.toDto(created);
  }

  async listEvidenceSubmissions(
    familyId: string,
    learnerId?: string,
  ): Promise<EvidenceSubmissionResponseDto[]> {
    const rows = await this.repository.list(familyId, learnerId);
    return rows.map((row) => this.toDto(row));
  }

  async getEvidenceSubmission(familyId: string, id: string): Promise<EvidenceSubmissionResponseDto> {
    const row = await this.repository.findById(familyId, id);
    if (!row) throw new NotFoundException('Evidence submission not found.');
    return this.toDto(row);
  }

  async validateEvidenceSubmission(
    familyId: string,
    id: string,
    status: 'VALIDATED' | 'REJECTED',
    validatedByUserId: string,
  ): Promise<EvidenceSubmissionResponseDto> {
    const reconciled = await this.achievementRepository.validateAndReconcile(familyId, id, status, validatedByUserId);
    if (!reconciled) throw new NotFoundException('Evidence submission not found.');
    return this.toDto(reconciled.evidence as EvidenceSubmissionWithCompetencies);
  }

  private toDto(row: EvidenceSubmissionWithCompetencies): EvidenceSubmissionResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      learnerId: row.learnerId,
      evidenceTypeId: row.evidenceTypeId,
      authorId: row.authorId,
      textContent: row.textContent,
      fileUrl: row.fileUrl,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes,
      checksumSha256: row.checksumSha256,
      validationStatus: row.validationStatus as EvidenceValidationStatus,
      validatedByUserId: row.validatedByUserId,
      validatedAt: row.validatedAt ? row.validatedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      competencies: row.competencies.map((c) => ({
        id: c.id,
        evidenceSubmissionId: c.evidenceSubmissionId,
        competencyDefinitionId: c.competencyDefinitionId,
        competencyVersion: c.competencyVersion,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }
}
