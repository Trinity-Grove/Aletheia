import { NotFoundException } from '@nestjs/common';
import type { LearnerLearningPathSelectionResponseDto } from '@aletheia/contracts';
import { LearnerLearningPathSelectionService } from './learner-learning-path-selection.service.js';
import type {
  LearnerLearningPathSelectionRepository,
  LearnerLearningPathSelectionWithPath,
  PublishedLearningPathCatalogRow,
} from '../infrastructure/learner-learning-path-selection.repository.js';

const FAMILY_ID = '00000000-0000-4000-8000-000000000001';
const LEARNER_ID = '00000000-0000-4000-8000-000000000002';
const YEAR_ID = '00000000-0000-4000-8000-000000000003';
const PATH_ID = '00000000-0000-4000-8000-000000000004';
const NOW = new Date('2026-10-23T00:00:00.000Z');

function selection(): LearnerLearningPathSelectionWithPath {
  return {
    id: '00000000-0000-4000-8000-000000000005',
    familyId: FAMILY_ID,
    learnerId: LEARNER_ID,
    academicYearId: YEAR_ID,
    pathId: PATH_ID,
    enabled: true,
    createdAt: NOW,
    updatedAt: NOW,
    path: { code: 'TRIVIUM.GRAMMAR', name: 'Gramática', version: 1, status: 'PUBLISHED' },
  } as LearnerLearningPathSelectionWithPath;
}

function catalogRow(): PublishedLearningPathCatalogRow {
  return {
    id: PATH_ID,
    code: 'TRIVIUM.GRAMMAR',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: '1.0.0',
    domainId: '00000000-0000-4000-8000-000000000006',
    name: 'Gramática',
    description: 'Fundamentos da linguagem.',
    metadata: { educationalStages: ['PRIMARY'], ageRecommendation: { min: 6, max: 11 } },
    createdAt: NOW,
    publishedAt: NOW,
    deprecatedAt: null,
    competencies: [{ code: 'TRIVIUM.GRAMMAR.CLOSE_READING', title: 'Leitura atenta', level: 1, metadata: { starterObjectives: ['Recontar ideias.'] } }],
    learnerSelections: [{ enabled: true }],
  } as unknown as PublishedLearningPathCatalogRow;
}

describe('LearnerLearningPathSelectionService', () => {
  let service: LearnerLearningPathSelectionService;
  let repository: jest.Mocked<Pick<LearnerLearningPathSelectionRepository, 'listPublishedCatalog' | 'upsert'>>;

  beforeEach(() => {
    repository = {
      listPublishedCatalog: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<Pick<LearnerLearningPathSelectionRepository, 'listPublishedCatalog' | 'upsert'>>;
    service = new LearnerLearningPathSelectionService(repository as unknown as LearnerLearningPathSelectionRepository);
  });

  it('maps only the selected learner/year catalog and preserves competency objectives', async () => {
    repository.listPublishedCatalog.mockResolvedValue([catalogRow()]);

    const result = await service.listCatalog(FAMILY_ID, LEARNER_ID, YEAR_ID);

    expect(repository.listPublishedCatalog).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, YEAR_ID);
    expect(result).toEqual([expect.objectContaining({
      id: PATH_ID,
      code: 'TRIVIUM.GRAMMAR',
      selected: true,
      competencies: [{ code: 'TRIVIUM.GRAMMAR.CLOSE_READING', title: 'Leitura atenta', level: 1, metadata: { starterObjectives: ['Recontar ideias.'] } }],
    })]);
  });

  it('hides an invalid or cross-family learner/year context as not found', async () => {
    repository.listPublishedCatalog.mockResolvedValue(null);

    await expect(service.listCatalog(FAMILY_ID, LEARNER_ID, YEAR_ID)).rejects.toThrow(NotFoundException);
  });

  it('maps the persisted learner/year selection response', async () => {
    repository.upsert.mockResolvedValue(selection());

    const result: LearnerLearningPathSelectionResponseDto = await service.upsert(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, { enabled: true });

    expect(repository.upsert).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, true);
    expect(result).toEqual(expect.objectContaining({ familyId: FAMILY_ID, learnerId: LEARNER_ID, academicYearId: YEAR_ID, pathId: PATH_ID, enabled: true }));
    expect(result.path).toEqual({ code: 'TRIVIUM.GRAMMAR', name: 'Gramática', version: 1, status: 'PUBLISHED' });
    expect(result.updatedAt).toBe('2026-10-23T00:00:00.000Z');
  });

  it('rejects missing or unpublished path selections', async () => {
    repository.upsert.mockResolvedValue(null);

    await expect(service.upsert(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, { enabled: true })).rejects.toThrow(NotFoundException);
  });
});
