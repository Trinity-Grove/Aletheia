import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CURRICULUM_PACK_EXPORT_FORMAT_VERSION,
  type CurriculumPackExportDocument,
  type CurriculumPackImportReport,
  type PortableRef,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import {
  findDefinitionByCodeVersion,
  importDefinition,
  UnresolvedRefError,
  type RefResolver,
} from '../infrastructure/curriculum-pack-portability.js';

const refKey = (ref: PortableRef): string => `${ref.type}|${ref.code}|${ref.version}`;

// Import a curriculum pack export document (issue #96 Fase 4, section
// 28, write half). The document is already schema-validated by
// `importCurriculumPackRequestSchema` at the controller boundary
// (Zod rejects malformed input before this service ever runs) --
// this service's own job is: format-version compatibility, conflict
// detection, missing-dependency detection, and (for a real, non-dry-run
// import) actually creating rows.
//
// Item creation uses a fixed-point algorithm: repeatedly attempt every
// not-yet-created item; an item whose references aren't resolvable yet
// (because the thing it points to hasn't been created in this pass)
// is deferred to the next pass. This handles arbitrary manifest
// ordering without needing a hand-written per-type dependency graph --
// once a full pass makes no progress, whatever's left is genuinely
// blocked (a reference to something neither pre-existing nor included
// in this document) and is reported, not silently dropped.
@Injectable()
export class CurriculumPackImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly packRepository: CurriculumPackRepository,
  ) {}

  async importPack(document: CurriculumPackExportDocument, dryRun: boolean): Promise<CurriculumPackImportReport> {
    if (document.formatVersion !== CURRICULUM_PACK_EXPORT_FORMAT_VERSION) {
      throw new BadRequestException(
        `Unsupported export format version "${document.formatVersion}" -- this importer supports ` +
          `"${CURRICULUM_PACK_EXPORT_FORMAT_VERSION}".`,
      );
    }

    const conflicts: CurriculumPackImportReport['conflicts'] = [];
    const missingDependencies: CurriculumPackImportReport['missingDependencies'] = [];
    const wouldCreate: PortableRef[] = [];
    const created: PortableRef[] = [];
    const blocked: CurriculumPackImportReport['blocked'] = [];

    // Pack-level dependency check: satisfied by an existing local pack,
    // or by the document's own declared pack (a dependency referencing
    // the very pack being imported) -- packs are not nested inside an
    // export document, so "included in the same document" can only mean
    // the document's own pack entry in this format.
    for (const dependency of document.dependencies) {
      const isSelf =
        dependency.dependsOnCode === document.pack.code && dependency.dependsOnVersion === document.pack.version;
      if (isSelf) continue;
      const existingPack = await this.packRepository.findPackByCodeVersion(
        dependency.dependsOnCode,
        dependency.dependsOnVersion,
      );
      if (!existingPack) {
        missingDependencies.push({
          dependsOnCode: dependency.dependsOnCode,
          dependsOnVersion: dependency.dependsOnVersion,
        });
      }
    }

    // Conflict check for the pack itself -- reported separately from
    // `items` since a pack isn't one of the 12 bundleable definition
    // types.
    const existingPack = await this.packRepository.findPackByCodeVersion(document.pack.code, document.pack.version);
    const packAlreadyExists = Boolean(existingPack);
    const packStatus: CurriculumPackImportReport['pack'] = {
      code: document.pack.code,
      version: document.pack.version,
      outcome: packAlreadyExists ? 'ALREADY_EXISTS' : dryRun ? 'WOULD_CREATE' : 'CREATED',
    };

    const pending: typeof document.items = [];
    for (const item of document.items) {
      const existing = await findDefinitionByCodeVersion(this.prisma, item.definitionType, item.code, item.version);
      if (existing) {
        conflicts.push({
          ref: { type: item.definitionType, code: item.code, version: item.version },
          reason: 'ALREADY_EXISTS',
        });
      } else {
        wouldCreate.push({ type: item.definitionType, code: item.code, version: item.version });
        pending.push(item);
      }
    }

    if (dryRun) {
      return { dryRun: true, pack: packStatus, wouldCreate, created: [], conflicts, missingDependencies, blocked };
    }

    // Real import: create the pack itself first (if it doesn't already
    // exist), then fixed-point-create every non-conflicting item.
    if (!packAlreadyExists) {
      await this.packRepository.createPack({
        code: document.pack.code,
        version: document.pack.version,
        status: 'DRAFT',
        schemaVersion: document.pack.schemaVersion,
        name: document.pack.name,
        description: document.pack.description ?? null,
        metadata: document.pack.metadata,
      });
    }

    // Locally-created-this-run ids, so later items in the same document
    // can resolve references to earlier ones before either exists in a
    // committed transaction the resolver could otherwise see.
    const createdIds = new Map<string, string>();

    const resolveRef: RefResolver = async (ref) => {
      if (!ref) return null;
      const key = refKey(ref);
      if (createdIds.has(key)) return createdIds.get(key)!;
      const existing = await findDefinitionByCodeVersion(this.prisma, ref.type, ref.code, ref.version);
      return existing?.id ?? null;
    };

    let remaining = pending;
    while (remaining.length > 0) {
      const stillBlocked: typeof pending = [];
      let progressed = false;

      for (const item of remaining) {
        try {
          const { id } = await importDefinition(
            this.prisma,
            item.definitionType,
            item.code,
            item.version,
            item.schemaVersion,
            item.content,
            resolveRef,
          );
          createdIds.set(refKey({ type: item.definitionType, code: item.code, version: item.version }), id);
          created.push({ type: item.definitionType, code: item.code, version: item.version });
          progressed = true;
        } catch (error) {
          if (error instanceof UnresolvedRefError) {
            stillBlocked.push(item);
          } else {
            throw error;
          }
        }
      }

      if (!progressed) {
        for (const item of stillBlocked) {
          blocked.push({
            ref: { type: item.definitionType, code: item.code, version: item.version },
            reason: 'One or more references could not be resolved (neither pre-existing nor included in this document).',
          });
        }
        break;
      }
      remaining = stillBlocked;
    }

    // Pack dependencies are recorded regardless of whether the
    // depended-on pack exists -- CurriculumPackDependency is a
    // deliberately soft reference (see the model comment in
    // schema.prisma). Only record them if we actually created the pack
    // this run (if it already existed, its dependencies already exist
    // from whenever it was first created/imported).
    if (!packAlreadyExists) {
      const newPack = await this.packRepository.findPackByCodeVersion(document.pack.code, document.pack.version);
      if (newPack) {
        for (const dependency of document.dependencies) {
          await this.packRepository.addDependency(newPack.id, {
            dependsOnCode: dependency.dependsOnCode,
            dependsOnVersion: dependency.dependsOnVersion,
          });
        }
        for (const item of document.items) {
          // Only link items that were actually created (or already
          // existed) -- a blocked item is deliberately left out of the
          // new pack's manifest, since the pack shouldn't claim to
          // bundle something that failed to import.
          const wasCreatedOrExisted = !blocked.some(
            (b) => b.ref.type === item.definitionType && b.ref.code === item.code && b.ref.version === item.version,
          );
          if (wasCreatedOrExisted) {
            await this.packRepository.addItem(newPack.id, {
              definitionType: item.definitionType,
              code: item.code,
              version: item.version,
            });
          }
        }
      }
    }

    return { dryRun: false, pack: packStatus, wouldCreate: [], created, conflicts, missingDependencies, blocked };
  }
}
