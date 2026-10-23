import { PrismaService } from '../../../platform/database/prisma.service.js';
import { LearnerLearningPathSelectionRepository } from './learner-learning-path-selection.repository.js';

const FAMILY_ID = '00000000-0000-4000-8000-000000000001';
const LEARNER_ID = '00000000-0000-4000-8000-000000000002';
const YEAR_ID = '00000000-0000-4000-8000-000000000003';
const PATH_ID = '00000000-0000-4000-8000-000000000004';

function createPrisma() {
  return {
    learner: { findFirst: jest.fn().mockResolvedValue({ id: LEARNER_ID }) },
    academicYear: { findFirst: jest.fn().mockResolvedValue({ id: YEAR_ID }) },
    learningPath: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue({ id: PATH_ID }),
    },
    learnerLearningPathSelection: { upsert: jest.fn().mockResolvedValue({ id: 'selection-id' }) },
  } as unknown as PrismaService;
}

describe('LearnerLearningPathSelectionRepository', () => {
  it('returns only published paths with competencies and the requested learner/year selection', async () => {
    const prisma = createPrisma();
    const repository = new LearnerLearningPathSelectionRepository(prisma);

    await repository.listPublishedCatalog(FAMILY_ID, LEARNER_ID, YEAR_ID);

    expect(prisma.learner.findFirst).toHaveBeenCalledWith({ where: { id: LEARNER_ID, familyId: FAMILY_ID }, select: { id: true } });
    expect(prisma.academicYear.findFirst).toHaveBeenCalledWith({ where: { id: YEAR_ID, familyId: FAMILY_ID }, select: { id: true } });
    expect(prisma.learningPath.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: 'PUBLISHED', domain: { is: { code: 'CLASSICAL_EDUCATION', status: 'PUBLISHED', isActive: true } } },
      orderBy: [{ code: 'asc' }, { version: 'desc' }],
      include: expect.objectContaining({
        competencies: expect.objectContaining({ where: { status: 'PUBLISHED' } }),
        learnerSelections: { where: { familyId: FAMILY_ID, learnerId: LEARNER_ID, academicYearId: YEAR_ID }, select: { enabled: true } },
      }),
    }));
  });

  it('returns only the latest published version for each Trivium path code', async () => {
    const prisma = createPrisma();
    const latest = {
      id: '00000000-0000-4000-8000-000000000005',
      code: 'TRIVIUM.GRAMMAR', version: 2, name: 'Grammar v2', description: null,
      metadata: {}, competencies: [], learnerSelections: [{ enabled: true }],
    };
    const older = { ...latest, id: PATH_ID, version: 1, name: 'Grammar v1', learnerSelections: [] };
    (prisma.learningPath.findMany as jest.Mock).mockResolvedValue([latest, older]);
    const repository = new LearnerLearningPathSelectionRepository(prisma);

    const result = await repository.listPublishedCatalog(FAMILY_ID, LEARNER_ID, YEAR_ID);

    expect(result?.map((path) => [path.code, path.version])).toEqual([['TRIVIUM.GRAMMAR', 2]]);
  });

  it('does not query catalog data when learner belongs to another family', async () => {
    const prisma = createPrisma();
    (prisma.learner.findFirst as jest.Mock).mockResolvedValue(null);
    const repository = new LearnerLearningPathSelectionRepository(prisma);

    await expect(repository.listPublishedCatalog(FAMILY_ID, LEARNER_ID, YEAR_ID)).resolves.toBeNull();

    expect(prisma.learningPath.findMany).not.toHaveBeenCalled();
  });

  it('does not mutate selection for a learner or academic year outside the family', async () => {
    const prisma = createPrisma();
    (prisma.academicYear.findFirst as jest.Mock).mockResolvedValue(null);
    const repository = new LearnerLearningPathSelectionRepository(prisma);

    await expect(repository.upsert(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, true)).resolves.toBeNull();

    expect(prisma.learningPath.findFirst).not.toHaveBeenCalled();
    expect(prisma.learnerLearningPathSelection.upsert).not.toHaveBeenCalled();
  });

  it('rejects a path unless it is published before upserting the learner/year selection', async () => {
    const prisma = createPrisma();
    (prisma.learningPath.findFirst as jest.Mock).mockResolvedValue(null);
    const repository = new LearnerLearningPathSelectionRepository(prisma);

    await expect(repository.upsert(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, true)).resolves.toBeNull();

    expect(prisma.learnerLearningPathSelection.upsert).not.toHaveBeenCalled();
  });

  it('upserts by family, learner, year, and path so another context remains independent', async () => {
    const prisma = createPrisma();
    const repository = new LearnerLearningPathSelectionRepository(prisma);

    await repository.upsert(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, false);

    expect(prisma.learnerLearningPathSelection.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { familyId_learnerId_academicYearId_pathId: { familyId: FAMILY_ID, learnerId: LEARNER_ID, academicYearId: YEAR_ID, pathId: PATH_ID } },
      create: { familyId: FAMILY_ID, learnerId: LEARNER_ID, academicYearId: YEAR_ID, pathId: PATH_ID, enabled: false },
      update: { enabled: false },
    }));
  });
});
