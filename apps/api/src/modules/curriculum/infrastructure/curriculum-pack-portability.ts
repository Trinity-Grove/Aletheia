import type { Prisma } from '@prisma/client';
import type { CurriculumPackDefinitionType, PortableRef } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Export- and import-direction (de)serialization for every definition
// type a curriculum pack can bundle (issue #96 Fase 4, section 28).
// Export: a handler fetches a row by (code, version) and turns it into
// portable content -- scalar fields as-is, and any foreign-key
// reference resolved to a {type, code, version} pointer (never a raw
// UUID, since the receiving database won't have this one's IDs).
// Import: the reverse -- content + a ref resolver -> a brand-new DRAFT
// row (import never overwrites an existing row and never auto-
// publishes; that's the caller's job).
//
// A plain per-type switch rather than a heavier abstraction -- there are
// exactly 12 known types (CURRICULUM_PACK_DEFINITION_TYPES), and each
// has a genuinely different shape (join tables, embedded child rows,
// nullable FKs), so a shared generic interface would mostly be
// boilerplate around 12 one-off implementations anyway.

export interface DefinitionLookup {
  id: string;
  status: string;
  schemaVersion: string;
}

async function refFromId(
  prisma: PrismaService,
  type: CurriculumPackDefinitionType,
  id: string | null,
): Promise<PortableRef | null> {
  if (!id) return null;
  switch (type) {
    case 'LearningDomain': {
      const row = await prisma.learningDomain.findUnique({ where: { id }, select: { code: true, version: true } });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'CompetencyDefinition': {
      const row = await prisma.competencyDefinition.findUnique({
        where: { id },
        select: { code: true, version: true },
      });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'LearningPath': {
      const row = await prisma.learningPath.findUnique({ where: { id }, select: { code: true, version: true } });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'RubricDefinition': {
      const row = await prisma.rubricDefinition.findUnique({ where: { id }, select: { code: true, version: true } });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'ActivityDefinition': {
      const row = await prisma.activityDefinition.findUnique({
        where: { id },
        select: { code: true, version: true },
      });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'EvidenceTypeDefinition': {
      const row = await prisma.evidenceTypeDefinition.findUnique({
        where: { id },
        select: { code: true, version: true },
      });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'PedagogicalModelDefinition': {
      const row = await prisma.pedagogicalModelDefinition.findUnique({
        where: { id },
        select: { code: true, version: true },
      });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    case 'TheologicalTraditionDefinition': {
      const row = await prisma.theologicalTraditionDefinition.findUnique({
        where: { id },
        select: { code: true, version: true },
      });
      return row ? { type, code: row.code, version: row.version } : null;
    }
    default:
      return null;
  }
}

export async function findDefinitionByCodeVersion(
  prisma: PrismaService,
  type: CurriculumPackDefinitionType,
  code: string,
  version: number,
): Promise<DefinitionLookup | null> {
  switch (type) {
    case 'LearningDomain':
      return prisma.learningDomain.findUnique({ where: { code_version: { code, version } } });
    case 'CompetencyDefinition':
      return prisma.competencyDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'LearningPath':
      return prisma.learningPath.findUnique({ where: { code_version: { code, version } } });
    case 'SkillDefinition':
      return prisma.skillDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'RubricDefinition':
      return prisma.rubricDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'EvidenceTypeDefinition':
      return prisma.evidenceTypeDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'ActivityDefinition':
      return prisma.activityDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'CurriculumDefinition':
      return prisma.curriculumDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'PedagogicalModelDefinition':
      return prisma.pedagogicalModelDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'TheologicalTraditionDefinition':
      return prisma.theologicalTraditionDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'TheologicalPositionDefinition':
      return prisma.theologicalPositionDefinition.findUnique({ where: { code_version: { code, version } } });
    case 'BibleTranslationDefinition':
      return prisma.bibleTranslationDefinition.findUnique({ where: { code_version: { code, version } } });
    default:
      return null;
  }
}

export async function exportDefinitionContent(
  prisma: PrismaService,
  type: CurriculumPackDefinitionType,
  code: string,
  version: number,
): Promise<Record<string, unknown> | null> {
  switch (type) {
    case 'LearningDomain': {
      const row = await prisma.learningDomain.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return {
        name: row.name,
        description: row.description,
        parentRef: await refFromId(prisma, 'LearningDomain', row.parentId),
        metadata: row.metadata,
      };
    }
    case 'CompetencyDefinition': {
      const row = await prisma.competencyDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return {
        title: row.title,
        level: row.level,
        domainRef: await refFromId(prisma, 'LearningDomain', row.domainId),
        pathRef: await refFromId(prisma, 'LearningPath', row.pathId),
        metadata: row.metadata,
      };
    }
    case 'LearningPath': {
      const row = await prisma.learningPath.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return {
        name: row.name,
        description: row.description,
        domainRef: await refFromId(prisma, 'LearningDomain', row.domainId),
        metadata: row.metadata,
      };
    }
    case 'SkillDefinition': {
      const row = await prisma.skillDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return {
        title: row.title,
        order: row.order,
        competencyRef: await refFromId(prisma, 'CompetencyDefinition', row.competencyId),
        metadata: row.metadata,
      };
    }
    case 'RubricDefinition': {
      const row = await prisma.rubricDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      const criteria = await prisma.rubricCriterion.findMany({ where: { rubricId: row.id }, orderBy: { order: 'asc' } });
      return {
        name: row.name,
        description: row.description,
        competencyRef: await refFromId(prisma, 'CompetencyDefinition', row.competencyId),
        criteria: criteria.map((c) => ({
          code: c.code,
          label: c.label,
          weight: c.weight,
          order: c.order,
          scaleMin: c.scaleMin,
          scaleMax: c.scaleMax,
          metadata: c.metadata,
        })),
        metadata: row.metadata,
      };
    }
    case 'EvidenceTypeDefinition': {
      const row = await prisma.evidenceTypeDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return { name: row.name, description: row.description, metadata: row.metadata };
    }
    case 'ActivityDefinition': {
      const row = await prisma.activityDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      const competencyLinks = await prisma.activityDefinitionCompetency.findMany({ where: { activityId: row.id } });
      const evidenceLinks = await prisma.activityDefinitionEvidenceType.findMany({ where: { activityId: row.id } });
      return {
        name: row.name,
        description: row.description,
        ageMin: row.ageMin,
        ageMax: row.ageMax,
        estimatedDurationMinutes: row.estimatedDurationMinutes,
        supervisionRequired: row.supervisionRequired,
        riskLevel: row.riskLevel,
        evidenceRequirementMode: row.evidenceRequirementMode,
        competencyLinks: await Promise.all(
          competencyLinks.map(async (link) => ({
            ref: await refFromId(prisma, 'CompetencyDefinition', link.competencyId),
            required: link.required,
            order: link.order,
          })),
        ),
        evidenceTypeLinks: await Promise.all(
          evidenceLinks.map(async (link) => ({
            ref: await refFromId(prisma, 'EvidenceTypeDefinition', link.evidenceTypeId),
          })),
        ),
        metadata: row.metadata,
      };
    }
    case 'CurriculumDefinition': {
      const row = await prisma.curriculumDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      const [domainLinks, competencyLinks, rubricLinks, activityLinks] = await Promise.all([
        prisma.curriculumDefinitionDomain.findMany({ where: { curriculumDefinitionId: row.id } }),
        prisma.curriculumDefinitionCompetency.findMany({ where: { curriculumDefinitionId: row.id } }),
        prisma.curriculumDefinitionRubric.findMany({ where: { curriculumDefinitionId: row.id } }),
        prisma.curriculumDefinitionActivity.findMany({ where: { curriculumDefinitionId: row.id } }),
      ]);
      return {
        name: row.name,
        description: row.description,
        pedagogicalModelRef: await refFromId(prisma, 'PedagogicalModelDefinition', row.pedagogicalModelDefinitionId),
        domainLinks: await Promise.all(
          domainLinks.map(async (l) => ({
            ref: await refFromId(prisma, 'LearningDomain', l.domainId),
            required: l.required,
            order: l.order,
          })),
        ),
        competencyLinks: await Promise.all(
          competencyLinks.map(async (l) => ({
            ref: await refFromId(prisma, 'CompetencyDefinition', l.competencyId),
            required: l.required,
            order: l.order,
          })),
        ),
        rubricLinks: await Promise.all(
          rubricLinks.map(async (l) => ({ ref: await refFromId(prisma, 'RubricDefinition', l.rubricId) })),
        ),
        activityLinks: await Promise.all(
          activityLinks.map(async (l) => ({
            ref: await refFromId(prisma, 'ActivityDefinition', l.activityId),
            required: l.required,
            order: l.order,
          })),
        ),
        metadata: row.metadata,
      };
    }
    case 'PedagogicalModelDefinition': {
      const row = await prisma.pedagogicalModelDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return { name: row.name, description: row.description, metadata: row.metadata };
    }
    case 'TheologicalTraditionDefinition': {
      const row = await prisma.theologicalTraditionDefinition.findUnique({
        where: { code_version: { code, version } },
      });
      if (!row) return null;
      return { name: row.name, description: row.description, metadata: row.metadata };
    }
    case 'TheologicalPositionDefinition': {
      const row = await prisma.theologicalPositionDefinition.findUnique({
        where: { code_version: { code, version } },
      });
      if (!row) return null;
      return {
        name: row.name,
        description: row.description,
        topic: row.topic,
        traditionRef: await refFromId(prisma, 'TheologicalTraditionDefinition', row.traditionId),
        metadata: row.metadata,
      };
    }
    case 'BibleTranslationDefinition': {
      const row = await prisma.bibleTranslationDefinition.findUnique({ where: { code_version: { code, version } } });
      if (!row) return null;
      return {
        name: row.name,
        language: row.language,
        youVersionId: row.youVersionId,
        translationPhilosophy: row.translationPhilosophy,
        publisher: row.publisher,
        licensingNotes: row.licensingNotes,
        metadata: row.metadata,
      };
    }
    default:
      return null;
  }
}

// Resolves a portable {type, code, version} pointer to a local row id.
// Returns null for a null ref (nullable FK); throws if a non-null ref
// can't be resolved -- the caller (import) decides whether that means
// "blocked, try again once more of the document is created" or
// "genuinely unresolvable."
export type RefResolver = (ref: PortableRef | null) => Promise<string | null>;

export class UnresolvedRefError extends Error {
  constructor(public readonly ref: PortableRef) {
    super(`Unresolved reference: ${ref.type} ${ref.code}@${ref.version}`);
  }
}

async function resolveRequired(resolveRef: RefResolver, ref: PortableRef | null): Promise<string> {
  if (!ref) throw new Error('Missing required reference.');
  const id = await resolveRef(ref);
  if (!id) throw new UnresolvedRefError(ref);
  return id;
}

async function resolveOptional(resolveRef: RefResolver, ref: PortableRef | null | undefined): Promise<string | null> {
  if (!ref) return null;
  const id = await resolveRef(ref);
  if (!id) throw new UnresolvedRefError(ref);
  return id;
}

/**
 * Creates a brand-new DRAFT row for one manifest item's content,
 * resolving every embedded reference via `resolveRef`. Never overwrites
 * an existing row (the caller is responsible for skipping items that
 * already exist by (type, code, version) before calling this) and
 * always creates with status DRAFT regardless of what status the
 * exported content carried -- import never auto-publishes.
 *
 * Throws `UnresolvedRefError` if a required reference can't yet be
 * resolved (e.g. its target hasn't been created yet in this same
 * import pass) -- the caller retries in a later pass once more of the
 * document has been created, per the fixed-point algorithm in
 * CurriculumPackImportService.
 */
export async function importDefinition(
  prisma: PrismaService,
  type: CurriculumPackDefinitionType,
  code: string,
  version: number,
  schemaVersion: string,
  content: Record<string, unknown>,
  resolveRef: RefResolver,
): Promise<{ id: string }> {
  const metadata = (content.metadata ?? {}) as Prisma.InputJsonValue;

  switch (type) {
    case 'LearningDomain': {
      const parentId = await resolveOptional(resolveRef, content.parentRef as PortableRef | null);
      const row = await prisma.learningDomain.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          parentId,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'CompetencyDefinition': {
      const domainId = await resolveRequired(resolveRef, content.domainRef as PortableRef | null);
      const pathId = await resolveOptional(resolveRef, content.pathRef as PortableRef | null);
      const row = await prisma.competencyDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          domainId,
          pathId,
          title: content.title as string,
          level: (content.level as number | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'LearningPath': {
      const domainId = await resolveRequired(resolveRef, content.domainRef as PortableRef | null);
      const row = await prisma.learningPath.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          domainId,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'SkillDefinition': {
      const competencyId = await resolveRequired(resolveRef, content.competencyRef as PortableRef | null);
      const row = await prisma.skillDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          competencyId,
          title: content.title as string,
          order: (content.order as number) ?? 0,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'RubricDefinition': {
      const competencyId = await resolveOptional(resolveRef, content.competencyRef as PortableRef | null);
      const criteria = (content.criteria as Array<Record<string, unknown>>) ?? [];
      const row = await prisma.rubricDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          competencyId,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          metadata,
          criteria: {
            create: criteria.map((c) => ({
              code: c.code as string,
              label: c.label as string,
              weight: (c.weight as number) ?? 1,
              order: (c.order as number) ?? 0,
              scaleMin: (c.scaleMin as number) ?? 0,
              scaleMax: (c.scaleMax as number) ?? 4,
              metadata: (c.metadata ?? {}) as Prisma.InputJsonValue,
            })),
          },
        },
      });
      return { id: row.id };
    }
    case 'EvidenceTypeDefinition': {
      const row = await prisma.evidenceTypeDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'ActivityDefinition': {
      const competencyLinks = (content.competencyLinks as Array<{ ref: PortableRef; required: boolean; order: number }>) ?? [];
      const evidenceTypeLinks = (content.evidenceTypeLinks as Array<{ ref: PortableRef }>) ?? [];
      const row = await prisma.activityDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          ageMin: (content.ageMin as number | null) ?? null,
          ageMax: (content.ageMax as number | null) ?? null,
          estimatedDurationMinutes: (content.estimatedDurationMinutes as number | null) ?? null,
          supervisionRequired: (content.supervisionRequired as boolean) ?? false,
          riskLevel: (content.riskLevel as string | null) ?? null,
          evidenceRequirementMode: (content.evidenceRequirementMode as string) ?? 'ANY',
          metadata,
        },
      });
      for (const link of competencyLinks) {
        const competencyId = await resolveRequired(resolveRef, link.ref);
        await prisma.activityDefinitionCompetency.create({
          data: { activityId: row.id, competencyId, required: link.required ?? true, order: link.order ?? 0 },
        });
      }
      for (const link of evidenceTypeLinks) {
        const evidenceTypeId = await resolveRequired(resolveRef, link.ref);
        await prisma.activityDefinitionEvidenceType.create({
          data: { activityId: row.id, evidenceTypeId },
        });
      }
      return { id: row.id };
    }
    case 'CurriculumDefinition': {
      const pedagogicalModelId = await resolveOptional(resolveRef, content.pedagogicalModelRef as PortableRef | null);
      const domainLinks = (content.domainLinks as Array<{ ref: PortableRef; required: boolean; order: number }>) ?? [];
      const competencyLinks =
        (content.competencyLinks as Array<{ ref: PortableRef; required: boolean; order: number }>) ?? [];
      const rubricLinks = (content.rubricLinks as Array<{ ref: PortableRef }>) ?? [];
      const activityLinks =
        (content.activityLinks as Array<{ ref: PortableRef; required: boolean; order: number }>) ?? [];
      const row = await prisma.curriculumDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          pedagogicalModelDefinitionId: pedagogicalModelId,
          metadata,
        },
      });
      for (const link of domainLinks) {
        const domainId = await resolveRequired(resolveRef, link.ref);
        await prisma.curriculumDefinitionDomain.create({
          data: { curriculumDefinitionId: row.id, domainId, required: link.required ?? true, order: link.order ?? 0 },
        });
      }
      for (const link of competencyLinks) {
        const competencyId = await resolveRequired(resolveRef, link.ref);
        await prisma.curriculumDefinitionCompetency.create({
          data: {
            curriculumDefinitionId: row.id,
            competencyId,
            required: link.required ?? true,
            order: link.order ?? 0,
          },
        });
      }
      for (const link of rubricLinks) {
        const rubricId = await resolveRequired(resolveRef, link.ref);
        await prisma.curriculumDefinitionRubric.create({
          data: { curriculumDefinitionId: row.id, rubricId },
        });
      }
      for (const link of activityLinks) {
        const activityId = await resolveRequired(resolveRef, link.ref);
        await prisma.curriculumDefinitionActivity.create({
          data: {
            curriculumDefinitionId: row.id,
            activityId,
            required: link.required ?? true,
            order: link.order ?? 0,
          },
        });
      }
      return { id: row.id };
    }
    case 'PedagogicalModelDefinition': {
      const row = await prisma.pedagogicalModelDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'TheologicalTraditionDefinition': {
      const row = await prisma.theologicalTraditionDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'TheologicalPositionDefinition': {
      const traditionId = await resolveOptional(resolveRef, content.traditionRef as PortableRef | null);
      const row = await prisma.theologicalPositionDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          traditionId,
          topic: content.topic as string,
          name: content.name as string,
          description: (content.description as string | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    case 'BibleTranslationDefinition': {
      const row = await prisma.bibleTranslationDefinition.create({
        data: {
          code,
          version,
          status: 'DRAFT',
          schemaVersion,
          name: content.name as string,
          language: content.language as string,
          youVersionId: content.youVersionId as string,
          translationPhilosophy: (content.translationPhilosophy as string | null) ?? null,
          publisher: (content.publisher as string | null) ?? null,
          licensingNotes: (content.licensingNotes as string | null) ?? null,
          metadata,
        },
      });
      return { id: row.id };
    }
    default:
      throw new Error(`Unsupported definition type for import: ${type}`);
  }
}
