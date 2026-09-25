import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type CurriculumPack, type FamilyCurriculumPack, type FamilyCurriculumPackRevision } from '@prisma/client';
import {
  curriculumPackExportDocumentSchema,
  type CurriculumPackExportDocument,
  type CurriculumPackResponseDto,
  type DefinitionStatus,
  type FamilyCurriculumPackResponseDto,
  type FamilyCurriculumPackRevisionResponseDto,
  type InstallFamilyCurriculumPackDto,
  type PublishFamilyCurriculumPackToCommunityOutput,
  type UpdateFamilyCurriculumPackDto,
} from '@aletheia/contracts';
import { CurriculumPackExportService } from './curriculum-pack-export.service.js';
import { CurriculumPackImportService } from './curriculum-pack-import.service.js';
import { CurriculumPackService } from './curriculum-pack.service.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { FamilyCurriculumPackRepository } from '../infrastructure/family-curriculum-pack.repository.js';

@Injectable()
export class FamilyCurriculumPackService {
  constructor(
    private readonly repository: FamilyCurriculumPackRepository,
    private readonly curriculumPackRepository: CurriculumPackRepository,
    private readonly exportService: CurriculumPackExportService,
    private readonly importService: CurriculumPackImportService,
    private readonly curriculumPackService: CurriculumPackService,
  ) {}

  async install(
    familyId: string,
    dto: InstallFamilyCurriculumPackDto,
  ): Promise<FamilyCurriculumPackResponseDto> {
    const source = await this.curriculumPackRepository.findPackById(dto.sourcePackId);
    if (!source) throw new NotFoundException('Curriculum pack not found.');
    if (source.status !== 'PUBLISHED') {
      throw new BadRequestException('Only published curriculum packs can be installed by a family.');
    }

    const document = await this.exportService.exportPack(source.id);
    try {
      const row = await this.repository.createInstance(
        familyId,
        source.id,
        source.code,
        source.version,
        document,
      );
      return this.toDto(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This curriculum pack is already installed for the family.');
      }
      throw error;
    }
  }

  async list(familyId: string): Promise<FamilyCurriculumPackResponseDto[]> {
    const rows = await this.repository.listByFamily(familyId);
    return rows.map((row) => this.toDto(row));
  }

  async listAvailable(): Promise<CurriculumPackResponseDto[]> {
    const rows = await this.curriculumPackRepository.listPublishedPacks();
    return rows.map((row) => this.toAvailablePackDto(row));
  }

  async get(familyId: string, id: string): Promise<FamilyCurriculumPackResponseDto> {
    const row = await this.requireInstance(familyId, id);
    return this.toDto(row);
  }

  async update(
    familyId: string,
    id: string,
    dto: UpdateFamilyCurriculumPackDto,
  ): Promise<FamilyCurriculumPackResponseDto> {
    const current = await this.requireInstance(familyId, id);
    const document = this.parseDocument(dto.document);
    if (
      document.pack.code !== current.sourcePackCode ||
      document.pack.version !== current.sourcePackVersion
    ) {
      throw new BadRequestException('A family pack revision cannot change its source pack identity.');
    }

    const updated = await this.repository.updateDocument(id, familyId, document);
    if (!updated) throw new NotFoundException('Family curriculum pack not found.');
    return this.toDto(updated);
  }

  async revisions(familyId: string, id: string): Promise<FamilyCurriculumPackRevisionResponseDto[]> {
    await this.requireInstance(familyId, id);
    const rows = await this.repository.listRevisions(id);
    return rows.map((row) => this.toRevisionDto(row));
  }

  // Publish the family's customized copy as a new, distinct community
  // submission (issue #244) -- a derivative work, not a mutation of the
  // pack it was installed from, so it always needs its own code/version.
  // Reuses CurriculumPackImportService.importPack, which already knows
  // how to turn a CurriculumPackExportDocument into real CurriculumPack/
  // CurriculumPackItem rows against the shared catalog -- the family's
  // document already IS that shape (see install() above).
  async publishToCommunity(
    familyId: string,
    id: string,
    userId: string,
    dto: PublishFamilyCurriculumPackToCommunityOutput,
  ): Promise<CurriculumPackResponseDto> {
    const instance = await this.requireInstance(familyId, id);

    const alreadyExists = await this.curriculumPackRepository.findPackByCodeVersion(dto.code, 1);
    if (alreadyExists) {
      throw new BadRequestException(
        `A curriculum pack with code "${dto.code}" already exists. Choose a different code.`,
      );
    }

    const sourceDocument = this.parseDocument(instance.document as CurriculumPackExportDocument);
    const newDocument: CurriculumPackExportDocument = {
      ...sourceDocument,
      exportedAt: new Date().toISOString(),
      pack: {
        ...sourceDocument.pack,
        code: dto.code,
        version: 1,
        status: 'DRAFT',
        name: dto.name,
        description: dto.description ?? sourceDocument.pack.description ?? null,
      },
    };

    await this.importService.importPack(newDocument, false, userId);

    const created = await this.curriculumPackRepository.findPackByCodeVersion(dto.code, 1);
    if (!created) {
      throw new BadRequestException('Failed to create the community curriculum pack.');
    }
    return this.curriculumPackService.getPack(created.id);
  }

  private async requireInstance(familyId: string, id: string): Promise<FamilyCurriculumPack> {
    const row = await this.repository.findByIdAndFamily(id, familyId);
    if (!row) throw new NotFoundException('Family curriculum pack not found.');
    return row;
  }

  private parseDocument(document: CurriculumPackExportDocument): CurriculumPackExportDocument {
    return curriculumPackExportDocumentSchema.parse(document);
  }

  private toDto(row: FamilyCurriculumPack): FamilyCurriculumPackResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      sourcePackId: row.sourcePackId,
      sourcePackCode: row.sourcePackCode,
      sourcePackVersion: row.sourcePackVersion,
      revision: row.revision,
      document: this.parseDocument(row.document as CurriculumPackExportDocument),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toRevisionDto(row: FamilyCurriculumPackRevision): FamilyCurriculumPackRevisionResponseDto {
    return {
      id: row.id,
      familyCurriculumPackId: row.familyCurriculumPackId,
      revision: row.revision,
      document: this.parseDocument(row.document as CurriculumPackExportDocument),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toAvailablePackDto(row: CurriculumPack): CurriculumPackResponseDto {
    return {
      id: row.id,
      code: row.code,
      version: row.version,
      status: row.status as DefinitionStatus,
      schemaVersion: row.schemaVersion,
      name: row.name,
      description: row.description,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
      deprecatedAt: row.deprecatedAt ? row.deprecatedAt.toISOString() : null,
    };
  }
}
