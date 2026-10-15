import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CurriculumPackCompositionService } from './curriculum-pack-composition.service.js';
import {
  CompositionRevisionConflictError,
  CurriculumPackCompositionRepository,
} from '../infrastructure/curriculum-pack-composition.repository.js';

const PACK = {
  id: 'pack-1',
  authorUserId: 'author-1',
  status: 'DRAFT',
  moderationStatus: 'DRAFT',
};

describe('CurriculumPackCompositionService', () => {
  const repository = {
    findCurrent: jest.fn(),
    listRevisions: jest.fn(),
    replace: jest.fn(),
  };
  const packRepository = { findPackById: jest.fn().mockResolvedValue(PACK) };
  const definitionsRepository = {
    listLearningDomains: jest.fn().mockResolvedValue([]),
    listCompetencyDefinitions: jest.fn().mockResolvedValue([]),
    listPedagogicalModelDefinitions: jest.fn().mockResolvedValue([]),
    listLearningPaths: jest.fn().mockResolvedValue([]),
    listSkillDefinitions: jest.fn().mockResolvedValue([]),
    listRubricDefinitions: jest.fn().mockResolvedValue([]),
    listEvidenceTypeDefinitions: jest.fn().mockResolvedValue([]),
    listActivityDefinitions: jest.fn().mockResolvedValue([]),
    listCurriculumDefinitions: jest.fn().mockResolvedValue([]),
    listTheologicalTraditionDefinitions: jest.fn().mockResolvedValue([]),
    listTheologicalPositionDefinitions: jest.fn().mockResolvedValue([]),
    listBibleTranslationDefinitions: jest.fn().mockResolvedValue([]),
  };
  const prisma = {
    skillDefinition: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'skill-1',
        code: 'SKILL',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        title: 'Skill',
        order: 1,
        competencyId: null,
        metadata: {},
      }),
    },
  };
  let service: CurriculumPackCompositionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CurriculumPackCompositionService(
      repository as unknown as CurriculumPackCompositionRepository,
      packRepository as never,
      definitionsRepository as never,
      prisma as never,
    );
  });

  it('lists only published catalog items and supports text filtering', async () => {
    definitionsRepository.listSkillDefinitions.mockResolvedValue([
      {
        code: 'SKILL_PUBLISHED',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        title: 'Reading skill',
        description: null,
      },
      {
        code: 'SKILL_DRAFT',
        version: 1,
        status: 'DRAFT',
        schemaVersion: '1.0.0',
        title: 'Draft skill',
        description: null,
      },
    ]);

    const result = await service.listCatalog({ definitionType: 'SkillDefinition', query: 'reading' });

    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe('SKILL_PUBLISHED');
  });

  it('rejects duplicate references before touching persistence', async () => {
    await expect(
      service.updateComposition('author-1', 'pack-1', {
        expectedRevision: 0,
        items: [
          { definitionType: 'SkillDefinition', code: 'SKILL', version: 1 },
          { definitionType: 'SkillDefinition', code: 'SKILL', version: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.replace).not.toHaveBeenCalled();
  });

  it('maps stale composition writes to a conflict response', async () => {
    repository.replace.mockRejectedValue(new CompositionRevisionConflictError(4));

    await expect(
      service.updateComposition('author-1', 'pack-1', {
        expectedRevision: 3,
        items: [{ definitionType: 'SkillDefinition', code: 'SKILL', version: 1 }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('protects composition reads from another author', async () => {
    await expect(service.getComposition('other-user', 'pack-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findCurrent).not.toHaveBeenCalled();
  });
});
