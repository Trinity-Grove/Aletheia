import { Injectable } from '@nestjs/common';
import type { CurriculumPack, CurriculumPackItem, CurriculumPackDependency, Prisma } from '@prisma/client';
import type {
  CreateCurriculumPackOutput,
  AddCurriculumPackItemOutput,
  AddCurriculumPackDependencyOutput,
} from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type { DefinitionStatusUpdate } from '../application/definition-status-transition.js';

// Thin CRUD for CurriculumPack + its manifest (CurriculumPackItem) and
// dependency list (CurriculumPackDependency) -- issue #96 Fase 4,
// section 27. Kept as its own repository/service/controller set (rather
// than folded into DefinitionsRepository/-Service/-Controller) because
// the sub-resource surface here (items, dependencies, and -- in
// follow-up PRs -- export/import) is large enough to warrant it, the
// same reasoning that already split ProfilesController/
// EvidenceSubmissionController out on their own. Same admin-gated
// pattern (PlatformAdminGuard) as every other admin resource.
@Injectable()
export class CurriculumPackRepository {
  constructor(private readonly prisma: PrismaService) {}

  createPack(dto: CreateCurriculumPackOutput): Promise<CurriculumPack> {
    return this.prisma.curriculumPack.create({
      data: {
        code: dto.code,
        version: dto.version,
        status: dto.status,
        schemaVersion: dto.schemaVersion,
        name: dto.name,
        description: dto.description ?? null,
        metadata: dto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  listPacks(): Promise<CurriculumPack[]> {
    return this.prisma.curriculumPack.findMany({ orderBy: [{ code: 'asc' }, { version: 'desc' }] });
  }

  findPackById(id: string): Promise<CurriculumPack | null> {
    return this.prisma.curriculumPack.findUnique({ where: { id } });
  }

  findPackByCodeVersion(code: string, version: number): Promise<CurriculumPack | null> {
    return this.prisma.curriculumPack.findUnique({ where: { code_version: { code, version } } });
  }

  updatePackStatus(id: string, update: DefinitionStatusUpdate): Promise<CurriculumPack> {
    return this.prisma.curriculumPack.update({ where: { id }, data: update });
  }

  addItem(packId: string, dto: AddCurriculumPackItemOutput): Promise<CurriculumPackItem> {
    return this.prisma.curriculumPackItem.create({
      data: {
        packId,
        definitionType: dto.definitionType,
        code: dto.code,
        version: dto.version,
      },
    });
  }

  listItems(packId: string): Promise<CurriculumPackItem[]> {
    return this.prisma.curriculumPackItem.findMany({ where: { packId }, orderBy: { createdAt: 'asc' } });
  }

  addDependency(packId: string, dto: AddCurriculumPackDependencyOutput): Promise<CurriculumPackDependency> {
    return this.prisma.curriculumPackDependency.create({
      data: {
        packId,
        dependsOnCode: dto.dependsOnCode,
        dependsOnVersion: dto.dependsOnVersion,
      },
    });
  }

  listDependencies(packId: string): Promise<CurriculumPackDependency[]> {
    return this.prisma.curriculumPackDependency.findMany({ where: { packId }, orderBy: { createdAt: 'asc' } });
  }
}
