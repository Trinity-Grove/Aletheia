import { Injectable } from '@nestjs/common';
import type { DefinitionTag } from '@prisma/client';
import type { AddDefinitionTagOutput, CurriculumPackDefinitionType, SearchDefinitionsByTagDto } from '@aletheia/contracts';
import { PrismaService } from '../../../platform/database/prisma.service.js';

// Same accessor map as DefinitionVersionOperationsService.MODEL_ACCESSOR --
// duplicated rather than imported/shared, since that one is a private
// implementation detail of a different, unrelated write path (rollback).
const MODEL_ACCESSOR: Record<CurriculumPackDefinitionType, string> = {
  LearningDomain: 'learningDomain',
  CompetencyDefinition: 'competencyDefinition',
  LearningPath: 'learningPath',
  SkillDefinition: 'skillDefinition',
  RubricDefinition: 'rubricDefinition',
  EvidenceTypeDefinition: 'evidenceTypeDefinition',
  ActivityDefinition: 'activityDefinition',
  ProjectDefinition: 'projectDefinition',
  CurriculumDefinition: 'curriculumDefinition',
  PedagogicalModelDefinition: 'pedagogicalModelDefinition',
  TheologicalTraditionDefinition: 'theologicalTraditionDefinition',
  TheologicalPositionDefinition: 'theologicalPositionDefinition',
  BibleTranslationDefinition: 'bibleTranslationDefinition',
};

@Injectable()
export class DefinitionTagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async definitionExists(entityType: CurriculumPackDefinitionType, definitionId: string): Promise<boolean> {
    const accessor = MODEL_ACCESSOR[entityType];
    const delegates = this.prisma as unknown as Record<
      string,
      { findUnique: (args: unknown) => Promise<unknown> }
    >;
    const delegate = delegates[accessor];
    if (!delegate) return false;
    const row = await delegate.findUnique({ where: { id: definitionId }, select: { id: true } });
    return row !== null;
  }

  create(dto: AddDefinitionTagOutput): Promise<DefinitionTag> {
    return this.prisma.definitionTag.create({
      data: {
        entityType: dto.entityType,
        definitionId: dto.definitionId,
        namespace: dto.namespace,
        tag: dto.tag,
      },
    });
  }

  listForDefinition(entityType: string, definitionId: string): Promise<DefinitionTag[]> {
    return this.prisma.definitionTag.findMany({
      where: { entityType, definitionId },
      orderBy: [{ namespace: 'asc' }, { tag: 'asc' }],
    });
  }

  findById(id: string): Promise<DefinitionTag | null> {
    return this.prisma.definitionTag.findUnique({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.definitionTag.delete({ where: { id } });
  }

  search(query: SearchDefinitionsByTagDto): Promise<DefinitionTag[]> {
    return this.prisma.definitionTag.findMany({
      where: {
        tag: query.tag,
        ...(query.namespace ? { namespace: query.namespace } : {}),
        ...(query.entityType ? { entityType: query.entityType } : {}),
      },
      orderBy: [{ entityType: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
