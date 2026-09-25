import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ConsentAction, ConsentDefinition, ConsentRecord } from '@prisma/client';
import type {
  ConsentComplianceCheckDto,
  ConsentDefinitionResponseDto,
  ConsentRecordResponseDto,
  ConsentScope,
  ConsentStatus,
  DefinitionStatus,
  FamilyConsentOverviewDto,
  GrantConsentDto,
  LearnerConsentStatusDto,
  RevokeConsentDto,
  TermConsentOverviewDto,
} from '@aletheia/contracts';
import { FamilyConsentRepository } from '../infrastructure/family-consent.repository.js';
import { ConsentDefinitionsRepository } from '../infrastructure/consent-definitions.repository.js';

@Injectable()
export class FamilyConsentService {
  constructor(
    private readonly repository: FamilyConsentRepository,
    private readonly consentDefsRepo: ConsentDefinitionsRepository,
  ) {}

  async grantConsent(
    familyId: string,
    userId: string,
    dto: GrantConsentDto,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ConsentRecordResponseDto> {
    const definition = await this.consentDefsRepo.findById(dto.consentDefinitionId);
    if (!definition || definition.status !== 'PUBLISHED') {
      throw new BadRequestException('Consent definition is not currently published.');
    }

    if (definition.scope === 'FAMILY') {
      if (dto.learnerId) {
        throw new BadRequestException('Learner ID must not be provided for family-scoped consent.');
      }
    } else if (definition.scope === 'LEARNER') {
      if (!dto.learnerId) {
        throw new BadRequestException('Learner ID is required for learner-scoped consent.');
      }
      const learner = await this.repository.findLearnerById(dto.learnerId);
      if (!learner || learner.familyId !== familyId) {
        throw new BadRequestException('Learner does not belong to this family.');
      }
    }

    const record = await this.repository.createRecord({
      familyId,
      userId,
      consentDefinitionId: dto.consentDefinitionId,
      learnerId: dto.learnerId ?? null,
      action: 'GRANTED',
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return this.toRecordDto(record);
  }

  async revokeConsent(
    familyId: string,
    userId: string,
    dto: RevokeConsentDto,
    context: { ipAddress?: string | null; userAgent?: string | null },
  ): Promise<ConsentRecordResponseDto> {
    const definition = await this.consentDefsRepo.findById(dto.consentDefinitionId);
    if (!definition) {
      throw new NotFoundException('Consent definition not found.');
    }

    if (definition.mandatory) {
      throw new BadRequestException('Mandatory consent terms cannot be revoked.');
    }

    if (definition.scope === 'FAMILY') {
      if (dto.learnerId) {
        throw new BadRequestException('Learner ID must not be provided for family-scoped consent.');
      }
    } else if (definition.scope === 'LEARNER') {
      if (!dto.learnerId) {
        throw new BadRequestException('Learner ID is required for learner-scoped consent.');
      }
      const learner = await this.repository.findLearnerById(dto.learnerId);
      if (!learner || learner.familyId !== familyId) {
        throw new BadRequestException('Learner does not belong to this family.');
      }
    }

    const record = await this.repository.createRecord({
      familyId,
      userId,
      consentDefinitionId: dto.consentDefinitionId,
      learnerId: dto.learnerId ?? null,
      action: 'REVOKED',
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });

    return this.toRecordDto(record);
  }

  async getFamilyConsentOverview(familyId: string): Promise<FamilyConsentOverviewDto> {
    const publishedDefs = await this.consentDefsRepo.findPublished();
    const learners = await this.repository.findFamilyLearners(familyId);
    const allRecords = await this.repository.findAllRecordsForFamily(familyId);

    const terms: TermConsentOverviewDto[] = [];

    for (const def of publishedDefs) {
      const codeDefs = await this.consentDefsRepo.findByCode(def.code);
      const olderDefIds = new Set(codeDefs.filter((d) => d.id !== def.id && d.version < def.version).map((d) => d.id));

      if (def.scope === 'FAMILY') {
        const latestRecord = allRecords.find(
          (r) => r.consentDefinitionId === def.id && (r.learnerId === null || r.learnerId === undefined),
        );

        let status: ConsentStatus;
        let lastRecord: ConsentRecordResponseDto | null = null;

        if (latestRecord) {
          status = latestRecord.action === 'GRANTED' ? 'ACTIVE' : 'REVOKED';
          lastRecord = this.toRecordDto(latestRecord);
        } else {
          const olderRecord = allRecords.find(
            (r) => olderDefIds.has(r.consentDefinitionId) && (r.learnerId === null || r.learnerId === undefined),
          );
          const hasOlderGranted = olderRecord?.action === 'GRANTED';

          if (hasOlderGranted) {
            status = 'OUTDATED';
            lastRecord = this.toRecordDto(olderRecord);
          } else {
            status = 'PENDING';
            lastRecord = null;
          }
        }

        terms.push({
          definition: this.toDefinitionDto(def),
          status,
          familyStatus: status,
          lastRecord,
        });
      } else {
        const learnerStatuses: LearnerConsentStatusDto[] = [];

        for (const learner of learners) {
          const latestRecord = allRecords.find(
            (r) => r.consentDefinitionId === def.id && r.learnerId === learner.id,
          );

          let learnerStatus: ConsentStatus;
          let lastRecord: ConsentRecordResponseDto | null = null;

          if (latestRecord) {
            learnerStatus = latestRecord.action === 'GRANTED' ? 'ACTIVE' : 'REVOKED';
            lastRecord = this.toRecordDto(latestRecord);
          } else {
            const olderRecord = allRecords.find(
              (r) => olderDefIds.has(r.consentDefinitionId) && r.learnerId === learner.id,
            );
            const hasOlderGranted = olderRecord?.action === 'GRANTED';

            if (hasOlderGranted) {
              learnerStatus = 'OUTDATED';
              lastRecord = this.toRecordDto(olderRecord);
            } else {
              learnerStatus = 'PENDING';
              lastRecord = null;
            }
          }

          learnerStatuses.push({
            learnerId: learner.id,
            learnerName: `${learner.firstName} ${learner.lastName || ''}`.trim(),
            status: learnerStatus,
            lastRecord,
          });
        }

        let overallStatus: ConsentStatus;
        if (learnerStatuses.length === 0) {
          overallStatus = 'PENDING';
        } else if (learnerStatuses.every((s) => s.status === 'ACTIVE')) {
          overallStatus = 'ACTIVE';
        } else if (learnerStatuses.some((s) => s.status === 'REVOKED')) {
          overallStatus = 'REVOKED';
        } else if (learnerStatuses.some((s) => s.status === 'OUTDATED')) {
          overallStatus = 'OUTDATED';
        } else {
          overallStatus = 'PENDING';
        }

        terms.push({
          definition: this.toDefinitionDto(def),
          status: overallStatus,
          learnerStatuses,
        });
      }
    }

    return { familyId, terms };
  }

  async checkMandatoryCompliance(familyId: string, learnerId?: string): Promise<ConsentComplianceCheckDto> {
    if (learnerId) {
      const learner = await this.repository.findLearnerById(learnerId);
      if (!learner || learner.familyId !== familyId) {
        throw new BadRequestException('Learner does not belong to this family.');
      }
    }

    const publishedDefs = await this.consentDefsRepo.findPublished();
    const mandatoryDefs = publishedDefs.filter((d) => d.mandatory);
    const pendingMandatoryTerms: ConsentDefinitionResponseDto[] = [];

    const familyLearners =
      !learnerId && mandatoryDefs.some((d) => d.scope === 'LEARNER')
        ? await this.repository.findFamilyLearners(familyId)
        : [];

    for (const def of mandatoryDefs) {
      if (def.scope === 'FAMILY') {
        const latest = await this.repository.findLatestRecord(familyId, def.id, null);
        if (!latest || latest.action !== 'GRANTED') {
          pendingMandatoryTerms.push(this.toDefinitionDto(def));
        }
      } else if (def.scope === 'LEARNER') {
        if (learnerId) {
          const latest = await this.repository.findLatestRecord(familyId, def.id, learnerId);
          if (!latest || latest.action !== 'GRANTED') {
            pendingMandatoryTerms.push(this.toDefinitionDto(def));
          }
        } else {
          let allLearnersGranted = true;
          for (const learner of familyLearners) {
            const latest = await this.repository.findLatestRecord(familyId, def.id, learner.id);
            if (!latest || latest.action !== 'GRANTED') {
              allLearnersGranted = false;
              break;
            }
          }
          if (!allLearnersGranted) {
            pendingMandatoryTerms.push(this.toDefinitionDto(def));
          }
        }
      }
    }

    return {
      compliant: pendingMandatoryTerms.length === 0,
      pendingMandatoryTerms,
    };
  }

  async getPublishedDefinitions(scope?: ConsentScope): Promise<ConsentDefinitionResponseDto[]> {
    const rows = await this.consentDefsRepo.findPublished(scope);
    return rows.map((row) => this.toDefinitionDto(row));
  }

  private toRecordDto(row: ConsentRecord): ConsentRecordResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      learnerId: row.learnerId ?? null,
      consentDefinitionId: row.consentDefinitionId,
      action: row.action as ConsentAction,
      consentedByUserId: row.consentedByUserId,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toDefinitionDto(row: ConsentDefinition): ConsentDefinitionResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      scope: row.scope as ConsentScope,
      mandatory: row.mandatory,
      title: row.title,
      description: row.description,
      content: row.content,
      purposes: row.purposes,
      metadata: row.metadata as Record<string, unknown> | null,
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
