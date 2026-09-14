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
});
