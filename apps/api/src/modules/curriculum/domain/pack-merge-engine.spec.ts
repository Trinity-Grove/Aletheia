import type {
  CurriculumPackExportDocument,
  ExportedDefinitionItem,
  PackDiffItem,
} from '@aletheia/contracts';
import { PackMergeEngine } from './pack-merge-engine.js';

describe('PackMergeEngine', () => {
  const createBaseDocument = (): CurriculumPackExportDocument => ({
    formatVersion: '1.0.0',
    exportedAt: '2026-09-01T00:00:00Z',
    pack: {
      code: 'TRIVIUM',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      name: 'Classical Trivium',
      description: 'Base pack',
      metadata: {},
    },
    dependencies: [],
    items: [
      {
        definitionType: 'CompetencyDefinition',
        code: 'COMP_GRAMMAR',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Gramática Básica', description: 'Original do autor' },
      },
      {
        definitionType: 'SkillDefinition',
        code: 'SKILL_READING',
        version: 1,
        status: 'PUBLISHED',
        schemaVersion: '1.0.0',
        content: { title: 'Leitura Silenciosa', difficulty: 1 },
      },
    ],
  });

  it('incorporates new items added upstream by the author', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument(); // Família não modificou nada ainda
    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;
    upstreamDoc.items.push({
      definitionType: 'SkillDefinition',
      code: 'SKILL_LOGIC',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      content: { title: 'Introdução à Lógica' },
    });

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    expect(diffReport.hasUpdate).toBe(true);
    expect(diffReport.summary.addedCount).toBe(1);
    expect(mergedDocument.items.find((i: ExportedDefinitionItem) => i.code === 'SKILL_LOGIC')).toBeDefined();
    expect(diffReport.items.find((i: PackDiffItem) => i.code === 'SKILL_LOGIC')?.action).toBe('ADDED_BY_AUTHOR');
  });

  it('strictly preserves family edits when author did not touch that item', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument();
    // Família adaptou a competência
    familyDoc.items[0]!.content = {
      title: 'Gramática Clássica Adaptada para a Família',
      description: 'Foco em latim litúrgico e português.',
    };
    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    const mergedItem = mergedDocument.items.find((i: ExportedDefinitionItem) => i.code === 'COMP_GRAMMAR');
    expect((mergedItem?.content as Record<string, unknown>)?.title).toBe('Gramática Clássica Adaptada para a Família');
    expect(diffReport.summary.preservedFamilyEditsCount).toBe(1);
    expect(diffReport.items.find((i: PackDiffItem) => i.code === 'COMP_GRAMMAR')?.action).toBe('PRESERVED_FAMILY_EDIT');
  });

  it('resolves conflicts in favor of family when both author and family touched the item', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument();
    familyDoc.items[0]!.content = { title: 'Customização dos Pais' };

    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;
    upstreamDoc.items[0]!.content = { title: 'Revisão Editorial do Autor v2' };

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    const mergedItem = mergedDocument.items.find((i: ExportedDefinitionItem) => i.code === 'COMP_GRAMMAR');
    // Prevalência absoluta da família
    expect((mergedItem?.content as Record<string, unknown>)?.title).toBe('Customização dos Pais');
    expect(diffReport.summary.conflictsCount).toBe(1);
    expect(diffReport.items.find((i: PackDiffItem) => i.code === 'COMP_GRAMMAR')?.action).toBe('CONFLICT_PRESERVED_FAMILY');
  });

  it('updates items modified upstream if the family kept the original content', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument(); // Intocado pela família
    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;
    upstreamDoc.items[1]!.content = { title: 'Leitura Fluente e Silenciosa (Aprimorada)', difficulty: 2 };

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    const mergedItem = mergedDocument.items.find((i: ExportedDefinitionItem) => i.code === 'SKILL_READING');
    expect((mergedItem?.content as Record<string, unknown>)?.title).toBe('Leitura Fluente e Silenciosa (Aprimorada)');
    expect(diffReport.summary.updatedCount).toBe(1);
    expect(diffReport.items.find((i: PackDiffItem) => i.code === 'SKILL_READING')?.action).toBe('UPDATED_BY_AUTHOR');
  });

  it('preserves items created locally by the family', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument();
    familyDoc.items.push({
      definitionType: 'SkillDefinition',
      code: 'SKILL_FAMILY_CUSTOM',
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
      content: { title: 'Costura e Bordado' },
    });
    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    expect(mergedDocument.items.find((i: ExportedDefinitionItem) => i.code === 'SKILL_FAMILY_CUSTOM')).toBeDefined();
    expect(diffReport.summary.preservedFamilyEditsCount).toBe(1);
    expect(diffReport.items.find((i: PackDiffItem) => i.code === 'SKILL_FAMILY_CUSTOM')?.action).toBe(
      'PRESERVED_FAMILY_EDIT',
    );
  });

  it('preserves deletion when family deleted an item from base pack', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument();
    // Família removeu SKILL_READING
    familyDoc.items = familyDoc.items.filter((i) => i.code !== 'SKILL_READING');

    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;
    // Upstream melhorou SKILL_READING
    upstreamDoc.items[1]!.content = { title: 'Leitura Fluente e Silenciosa (Aprimorada)' };

    const { mergedDocument, diffReport } = PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc);

    expect(mergedDocument.items.find((i: ExportedDefinitionItem) => i.code === 'SKILL_READING')).toBeUndefined();
    expect(diffReport.summary.preservedFamilyEditsCount).toBe(1);
    expect(diffReport.items.find((i: PackDiffItem) => i.code === 'SKILL_READING')?.action).toBe(
      'PRESERVED_FAMILY_EDIT',
    );
  });

  it('computes diff via computeDiff convenience method', () => {
    const baseDoc = createBaseDocument();
    const familyDoc = createBaseDocument();
    const upstreamDoc = createBaseDocument();
    upstreamDoc.pack.version = 2;

    const diffReport = PackMergeEngine.computeDiff(baseDoc, familyDoc, upstreamDoc);

    expect(diffReport.hasUpdate).toBe(true);
    expect(diffReport.currentVersion).toBe(1);
    expect(diffReport.latestVersion).toBe(2);
    expect(diffReport.sourcePackCode).toBe('TRIVIUM');
  });
});
