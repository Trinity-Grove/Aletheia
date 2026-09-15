import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type FamilyCurriculumPack, type FamilyCurriculumPackRevision } from '@prisma/client';
import {
  curriculumPackExportDocumentSchema,
  type CurriculumPackExportDocument,
  type FamilyCurriculumPackResponseDto,
  type FamilyCurriculumPackRevisionResponseDto,
  type InstallFamilyCurriculumPackDto,
  type UpdateFamilyCurriculumPackDto,
} from '@aletheia/contracts';
import { CurriculumPackExportService } from './curriculum-pack-export.service.js';
import { CurriculumPackRepository } from '../infrastructure/curriculum-pack.repository.js';
import { FamilyCurriculumPackRepository } from '../infrastructure/family-curriculum-pack.repository.js';

@Injectable()
export class FamilyCurriculumPackService {
  constructor(
    private readonly repository: FamilyCurriculumPackRepository,
    private readonly curriculumPackRepository: CurriculumPackRepository,
    private readonly exportService: CurriculumPackExportService,
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
}
