import { CurriculumController } from './curriculum.controller.js';

const FAMILY_ID = '00000000-0000-4000-8000-000000000001';
const LEARNER_ID = '00000000-0000-4000-8000-000000000002';
const YEAR_ID = '00000000-0000-4000-8000-000000000003';
const PATH_ID = '00000000-0000-4000-8000-000000000004';

describe('CurriculumController Trivium path routes', () => {
  it('passes family, learner, and year context to the published catalog service', async () => {
    const learningPathSelectionService = { listCatalog: jest.fn().mockResolvedValue([]), upsert: jest.fn() };
    const controller = new CurriculumController({} as any, {} as any, {} as any, learningPathSelectionService as any);

    await expect(controller.listTriviumPathCatalog(FAMILY_ID, { learnerId: LEARNER_ID, academicYearId: YEAR_ID })).resolves.toEqual([]);

    expect(learningPathSelectionService.listCatalog).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, YEAR_ID);
  });

  it('routes learner/year adoption without changing the existing family-wide API', async () => {
    const response = { familyId: FAMILY_ID, learnerId: LEARNER_ID, academicYearId: YEAR_ID, pathId: PATH_ID, enabled: true };
    const learningPathSelectionService = { listCatalog: jest.fn(), upsert: jest.fn().mockResolvedValue(response) };
    const controller = new CurriculumController({} as any, {} as any, {} as any, learningPathSelectionService as any);

    await expect(controller.upsertLearnerPathSelection(FAMILY_ID, PATH_ID, LEARNER_ID, YEAR_ID, { enabled: true })).resolves.toBe(response);

    expect(learningPathSelectionService.upsert).toHaveBeenCalledWith(FAMILY_ID, LEARNER_ID, YEAR_ID, PATH_ID, { enabled: true });
  });
});
