import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  ROLLBACK_ELIGIBLE_ENTITY_TYPES,
  type RollbackEligibleEntityType,
  type RollbackDefinitionVersionResultDto,
  type MigrateCompetencyTrackingReferencesResultDto,
  type DefinitionVersionOperationLogResponseDto,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { computeStatusTransition } from './definition-status-transition.js';

// Two explicit, admin-triggered operations on the Definition/Version
// pattern (issue #96 Fase 0, section 24 -- "migração controlada entre
// versões" and "rollback lógico"). Both are opt-in, never automatic, and
// both write a DefinitionVersionOperationLog row inside the same
// transaction as the mutation they perform, so nothing here is silent.
//
// Neither operation deletes a row or mutates a PUBLISHED row's content --
// only `status`/`deprecatedAt` (rollback) or a referencing entity's own FK
// columns (migration) ever change. The append-only invariant that the rest
// of this module depends on (DefinitionsService, every *CatalogResolver)
// holds throughout.

// Every Definition/Version table (LearningDomain, CompetencyDefinition,
// PedagogicalModelDefinition, ...) shares the exact same
// {id, code, version, status, schemaVersion, publishedAt, deprecatedAt}
// shape (issue #96 Fase 0), which is what makes one generic rollback
// implementation safe here -- this is a fixed, reviewed list of model
// accessors, not an arbitrary "any model" backdoor.
const MODEL_ACCESSOR: Record<RollbackEligibleEntityType, string> = {
  LearningDomain: 'learningDomain',
  CompetencyDefinition: 'competencyDefinition',
  PedagogicalModelDefinition: 'pedagogicalModelDefinition',
  LearningPath: 'learningPath',
  SkillDefinition: 'skillDefinition',
  RubricDefinition: 'rubricDefinition',
  EvidenceTypeDefinition: 'evidenceTypeDefinition',
  CurriculumDefinition: 'curriculumDefinition',
  ActivityDefinition: 'activityDefinition',
  TheologicalTraditionDefinition: 'theologicalTraditionDefinition',
  TheologicalPositionDefinition: 'theologicalPositionDefinition',
  ProgressionPolicy: 'progressionPolicy',
  BibleTranslationDefinition: 'bibleTranslationDefinition',
};

interface DefinitionRow {
  id: string;
  code: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'ARCHIVED';
  schemaVersion: string;
  publishedAt: Date | null;
  deprecatedAt: Date | null;
}

type DefinitionDelegate = {
  findFirst(args: unknown): Promise<DefinitionRow | null>;
  update(args: unknown): Promise<DefinitionRow>;
};

function majorSchemaVersion(schemaVersion: string): string {
  return schemaVersion.split('.')[0] ?? schemaVersion;
}

function isSchemaMajorCompatible(a: string, b: string): boolean {
  return majorSchemaVersion(a) === majorSchemaVersion(b);
}

@Injectable()
export class DefinitionVersionOperationsService {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(client: PrismaService | Prisma.TransactionClient, entityType: RollbackEligibleEntityType): DefinitionDelegate {
    const accessor = MODEL_ACCESSOR[entityType];
    const delegate = (client as unknown as Record<string, DefinitionDelegate>)[accessor];
    if (!delegate) throw new BadRequestException(`Unsupported entity type for rollback: ${entityType}.`);
    return delegate;
  }

  // --- Rollback lógico ---
  //
  // Deprecates a PUBLISHED version (an already-allowed, one-way
  // PUBLISHED -> DEPRECATED transition -- see definition-status-transition.ts,
  // nothing new is invented here). Every "current for code" resolver in
  // this module (PedagogicalModelDefinitionResolver.resolvePublished and
  // its siblings) does
  // `findFirst({ where: { code, status: 'PUBLISHED' }, orderBy: { version: 'desc' } })`,
  // so once the bad version is DEPRECATED, that query naturally falls back
  // to whatever other PUBLISHED version of the code has the next-highest
  // version number -- often the immediately preceding one, if an admin
  // never separately deprecated it. If no other PUBLISHED version exists,
  // resolution returns nothing until an admin explicitly publishes one --
  // that is a deliberate limitation of the existing one-way status
  // machine (DEPRECATED can never transition back to PUBLISHED), not a
  // bug introduced here.
  //
  // Entities pinned to the exact rolled-back version by id
  // (LearnerCompetencyTracking.competencyDefinitionId,
  // LearnerCompetencyAchievement.competencyDefinitionId) are completely
  // unaffected: they reference the row by its immutable id, and this
  // operation never changes that row's id or its substantive content.
  async rollbackDefinitionVersion(
    entityType: RollbackEligibleEntityType,
    code: string,
    version: number,
    performedByUserId: string,
    reason?: string,
  ): Promise<RollbackDefinitionVersionResultDto> {
    if (!ROLLBACK_ELIGIBLE_ENTITY_TYPES.includes(entityType)) {
      throw new BadRequestException(`Unsupported entity type for rollback: ${entityType}.`);
    }

    const delegate = this.delegate(this.prisma, entityType);
    const row = await delegate.findFirst({ where: { code, version } });
    if (!row) throw new NotFoundException(`${entityType} ${code}@${version} not found.`);
    if (row.status !== 'PUBLISHED') {
      throw new BadRequestException(
        `Cannot roll back ${entityType} ${code}@${version}: only a PUBLISHED version can be rolled back (current status: ${row.status}).`,
      );
    }

    const update = computeStatusTransition('PUBLISHED', 'DEPRECATED');

    return this.prisma.$transaction(async (tx) => {
      const txDelegate = this.delegate(tx, entityType);
      await txDelegate.update({ where: { id: row.id }, data: update });
      const fallback = await txDelegate.findFirst({
        where: { code, status: 'PUBLISHED' },
        orderBy: { version: 'desc' },
      });

      const log = await tx.definitionVersionOperationLog.create({
        data: {
          operationType: 'ROLLBACK',
          definitionCode: code,
          fromVersion: version,
          toVersion: fallback?.version ?? null,
          affectedEntityType: entityType,
          affectedEntityIds: [row.id],
          performedByUserId,
          metadata: { reason: reason ?? null },
        },
      });

      return {
        entityType,
        code,
        rolledBackVersion: version,
        newCurrentVersion: fallback?.version ?? null,
        logId: log.id,
      };
    });
  }

  // --- Migração controlada entre versões ---
  //
  // Explicit, opt-in re-pointing of a caller-selected set of
  // LearnerCompetencyTracking rows from one version of a
  // CompetencyDefinition to another. Deliberately scoped to this single
  // referencing table/column for this PR (issue #96 section 24) -- other
  // referencing tables are a separate, later change. Never a blanket
  // "migrate everyone on this code": every tracking row must be named by
  // id in `trackingIds`, and any id that doesn't actually belong to
  // `fromVersion` is skipped rather than silently migrated.
  //
  // Never touches LearnerCompetencyAchievement: that table is an
  // append-only historical record of an exact, already-awarded
  // competency+version (PR #133) and must never be repointed after the
  // fact, migration or no migration.
  async migrateCompetencyTrackingReferences(
    code: string,
    fromVersion: number,
    toVersion: number,
    trackingIds: string[],
    performedByUserId: string,
    reason?: string,
  ): Promise<MigrateCompetencyTrackingReferencesResultDto> {
    if (fromVersion === toVersion) {
      throw new BadRequestException('fromVersion and toVersion must differ.');
    }

    const [fromDef, toDef] = await Promise.all([
      this.prisma.competencyDefinition.findFirst({ where: { code, version: fromVersion } }),
      this.prisma.competencyDefinition.findFirst({ where: { code, version: toVersion } }),
    ]);
    if (!fromDef) throw new NotFoundException(`CompetencyDefinition ${code}@${fromVersion} not found.`);
    if (!toDef) throw new NotFoundException(`CompetencyDefinition ${code}@${toVersion} not found.`);
    if (toDef.status === 'ARCHIVED') {
      throw new BadRequestException(`Cannot migrate references onto an ARCHIVED version (${code}@${toVersion}).`);
    }
    if (!isSchemaMajorCompatible(fromDef.schemaVersion, toDef.schemaVersion)) {
      throw new BadRequestException(
        `Schema versions are not major-compatible: ${fromDef.schemaVersion} -> ${toDef.schemaVersion}.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const trackings = await tx.learnerCompetencyTracking.findMany({
        where: { id: { in: trackingIds } },
      });

      const migratedTrackingIds: string[] = [];
      const skippedTrackingIds: string[] = [];

      for (const trackingId of trackingIds) {
        const tracking = trackings.find((t) => t.id === trackingId);
        if (!tracking || tracking.competencyDefinitionId !== fromDef.id) {
          // Either the id doesn't exist, or the caller selected an id that
          // isn't actually pointing at fromVersion -- skip rather than
          // silently doing something the caller didn't ask for.
          skippedTrackingIds.push(trackingId);
          continue;
        }

        // Unique constraint is [learnerId, competencyDefinitionId,
        // competencyVersion] -- re-pointing would collide if the learner
        // already has a tracking row for the target version.
        const collision = await tx.learnerCompetencyTracking.findFirst({
          where: {
            learnerId: tracking.learnerId,
            competencyDefinitionId: toDef.id,
            competencyVersion: toDef.version,
            id: { not: tracking.id },
          },
          select: { id: true },
        });
        if (collision) {
          skippedTrackingIds.push(trackingId);
          continue;
        }

        await tx.learnerCompetencyTracking.update({
          where: { id: tracking.id },
          data: { competencyDefinitionId: toDef.id, competencyVersion: toDef.version },
        });
        migratedTrackingIds.push(trackingId);
      }

      const log = await tx.definitionVersionOperationLog.create({
        data: {
          operationType: 'MIGRATE_REFERENCES',
          definitionCode: code,
          fromVersion,
          toVersion,
          affectedEntityType: 'LearnerCompetencyTracking',
          affectedEntityIds: migratedTrackingIds,
          performedByUserId,
          metadata: { reason: reason ?? null, requestedTrackingIds: trackingIds, skippedTrackingIds },
        },
      });

      return { migratedTrackingIds, skippedTrackingIds, logId: log.id };
    });
  }

  async listOperationLogs(code?: string): Promise<DefinitionVersionOperationLogResponseDto[]> {
    const rows = await this.prisma.definitionVersionOperationLog.findMany({
      ...(code ? { where: { definitionCode: code } } : {}),
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      operationType: row.operationType,
      definitionCode: row.definitionCode,
      fromVersion: row.fromVersion,
      toVersion: row.toVersion,
      affectedEntityType: row.affectedEntityType,
      affectedEntityIds: row.affectedEntityIds as string[],
      performedByUserId: row.performedByUserId,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
