import { ProgressionPolicyCatalogResolver } from './progression-policy-catalog.resolver.js';

describe('ProgressionPolicyCatalogResolver', () => {
  it('returns only published supported policies with their evidence threshold', async () => {
    const prisma = {
      progressionPolicy: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '00000000-0000-4000-8000-000000000001',
            code: 'FOUNDATIONAL.EVIDENCE_COUNT',
            version: 2,
            status: 'PUBLISHED',
            schemaVersion: '1.0.0',
            name: 'Evidência validada',
            description: 'Uma evidência validada.',
            policyType: 'EVIDENCE_COUNT',
            rules: { minimumEvidenceCount: 2, prerequisites: [] },
            curriculumDefinitionId: null,
          },
          {
            id: '00000000-0000-4000-8000-000000000002',
            code: 'FOUNDATIONAL.EVIDENCE_COUNT',
            version: 1,
            status: 'PUBLISHED',
            schemaVersion: '1.0.0',
            name: 'Versão antiga',
            description: null,
            policyType: 'EVIDENCE_COUNT',
            rules: { minimumEvidenceCount: 1, prerequisites: [] },
            curriculumDefinitionId: null,
          },
          {
            id: '00000000-0000-4000-8000-000000000003',
            code: 'FOUNDATIONAL.HOURS',
            version: 1,
            status: 'PUBLISHED',
            schemaVersion: '1.0.0',
            name: 'Horas',
            description: null,
            policyType: 'HOURS',
            rules: { minimumHours: 2 },
            curriculumDefinitionId: null,
          },
        ]),
      },
    };

    const catalog = await new ProgressionPolicyCatalogResolver(prisma as never).listPublishedCatalog();

    expect(catalog).toEqual([
      {
        id: '00000000-0000-4000-8000-000000000001',
        code: 'FOUNDATIONAL.EVIDENCE_COUNT',
        name: 'Evidência validada',
        description: 'Uma evidência validada.',
        policyType: 'EVIDENCE_COUNT',
        minimumEvidenceCount: 2,
        curriculumDefinitionId: null,
      },
    ]);
  });

  it('exposes a rubric policy only when it references a published exact rubric and bounded thresholds for every criterion', async () => {
    const rubricId = '10000000-0000-4000-8000-000000000001';
    const criterionId = '20000000-0000-4000-8000-000000000001';
    const secondCriterionId = '20000000-0000-4000-8000-000000000002';
    const findUnique = jest.fn().mockResolvedValue({
      id: rubricId,
      version: 4,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      criteria: [{ id: criterionId, scaleMin: 1, scaleMax: 5 }, { id: secondCriterionId, scaleMin: 2, scaleMax: 4 }],
    });
    const prisma = {
      progressionPolicy: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: '30000000-0000-4000-8000-000000000001', code: 'RUBRIC.GOOD', version: 1,
            status: 'PUBLISHED', schemaVersion: '1.0.0', name: 'Rubric policy', description: null,
            policyType: 'EVIDENCE_RUBRIC',
            rules: { minimumEvidenceCount: 2, rubricDefinitionId: rubricId, rubricVersion: 4, minimumScoresByCriterion: { [criterionId]: 3, [secondCriterionId]: 3 }, requireHumanApproval: true, prerequisites: [] },
            curriculumDefinitionId: null,
          },
          {
            id: '30000000-0000-4000-8000-000000000002', code: 'RUBRIC.BAD_THRESHOLD', version: 1,
            status: 'PUBLISHED', schemaVersion: '1.0.0', name: 'Invalid threshold', description: null,
            policyType: 'EVIDENCE_RUBRIC',
            rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubricId, rubricVersion: 4, minimumScoresByCriterion: { [criterionId]: 6, [secondCriterionId]: 3 }, requireHumanApproval: false, prerequisites: [] },
            curriculumDefinitionId: null,
          },
          {
            id: '30000000-0000-4000-8000-000000000004', code: 'RUBRIC.WRONG_VERSION', version: 1,
            status: 'PUBLISHED', schemaVersion: '1.0.0', name: 'Wrong rubric version', description: null,
            policyType: 'EVIDENCE_RUBRIC',
            rules: { minimumEvidenceCount: 1, rubricDefinitionId: rubricId, rubricVersion: 3, minimumScoresByCriterion: { [criterionId]: 3, [secondCriterionId]: 3 }, requireHumanApproval: false, prerequisites: [] },
            curriculumDefinitionId: null,
          },
        ]),
      },
      rubricDefinition: { findUnique },
    };

    const catalog = await new ProgressionPolicyCatalogResolver(prisma as never).listPublishedCatalog();

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: rubricId },
      include: { criteria: { select: { id: true, scaleMin: true, scaleMax: true } } },
    });
    expect(catalog).toContainEqual(expect.objectContaining({
      id: '30000000-0000-4000-8000-000000000001',
      policyType: 'EVIDENCE_RUBRIC',
      rubricDefinitionId: rubricId,
      rubricVersion: 4,
      minimumScoresByCriterion: { [criterionId]: 3, [secondCriterionId]: 3 },
      requireHumanApproval: true,
    }));
    expect(catalog.some((entry) => entry.id === '30000000-0000-4000-8000-000000000002')).toBe(false);
    expect(catalog.some((entry) => entry.id === '30000000-0000-4000-8000-000000000004')).toBe(false);
  });

  it('does not expose a rubric policy when any criterion threshold is missing', async () => {
    const rubricId = '10000000-0000-4000-8000-000000000001';
    const criterionId = '20000000-0000-4000-8000-000000000001';
    const prisma = {
      progressionPolicy: { findMany: jest.fn().mockResolvedValue([{
        id: '30000000-0000-4000-8000-000000000003', code: 'RUBRIC.MISSING', version: 1,
        status: 'PUBLISHED', schemaVersion: '1.0.0', name: 'Missing threshold', description: null,
        policyType: 'EVIDENCE_RUBRIC', rules: {
          minimumEvidenceCount: 1, rubricDefinitionId: rubricId, rubricVersion: 4,
          minimumScoresByCriterion: { [criterionId]: 3 }, requireHumanApproval: false, prerequisites: [],
        }, curriculumDefinitionId: null,
      }]) },
      rubricDefinition: { findUnique: jest.fn().mockResolvedValue({
        id: rubricId, version: 4, status: 'PUBLISHED', schemaVersion: '1.0.0',
        criteria: [{ id: criterionId, scaleMin: 0, scaleMax: 4 }, { id: '20000000-0000-4000-8000-000000000002', scaleMin: 0, scaleMax: 4 }],
      }) },
    };

    await expect(new ProgressionPolicyCatalogResolver(prisma as never).listPublishedCatalog()).resolves.toEqual([]);
  });
});
