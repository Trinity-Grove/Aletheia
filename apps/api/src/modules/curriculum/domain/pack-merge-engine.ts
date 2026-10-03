import type {
  CurriculumPackExportDocument,
  ExportedDefinitionItem,
  PackDiffItem,
  PackDiffReport,
} from '@aletheia/contracts';
import { calculatePackChecksum, canonicalJsonStringify } from './pack-checksum.js';

export interface MergeResult {
  mergedDocument: CurriculumPackExportDocument;
  diffReport: PackDiffReport;
}

export class PackMergeEngine {
  static computeDiff(
    baseDoc: CurriculumPackExportDocument,
    familyDoc: CurriculumPackExportDocument,
    upstreamDoc: CurriculumPackExportDocument,
  ): PackDiffReport {
    return PackMergeEngine.merge(baseDoc, familyDoc, upstreamDoc).diffReport;
  }

  static merge(
    baseDoc: CurriculumPackExportDocument,
    familyDoc: CurriculumPackExportDocument,
    upstreamDoc: CurriculumPackExportDocument,
  ): MergeResult {
    const baseMap = new Map<string, ExportedDefinitionItem>();
    for (const item of baseDoc.items) {
      baseMap.set(`${item.definitionType}:${item.code}`, item);
    }

    const familyMap = new Map<string, ExportedDefinitionItem>();
    for (const item of familyDoc.items) {
      familyMap.set(`${item.definitionType}:${item.code}`, item);
    }

    const upstreamMap = new Map<string, ExportedDefinitionItem>();
    for (const item of upstreamDoc.items) {
      upstreamMap.set(`${item.definitionType}:${item.code}`, item);
    }

    const allKeys = new Set([
      ...baseMap.keys(),
      ...familyMap.keys(),
      ...upstreamMap.keys(),
    ]);

    const diffItems: PackDiffItem[] = [];
    const mergedItems: ExportedDefinitionItem[] = [];

    let addedCount = 0;
    let updatedCount = 0;
    let preservedFamilyEditsCount = 0;
    let conflictsCount = 0;

    for (const key of allKeys) {
      const base = baseMap.get(key);
      const family = familyMap.get(key);
      const upstream = upstreamMap.get(key);

      const target = family ?? upstream ?? base;
      const type = target!.definitionType;
      const code = target!.code;
      const itemName =
        ((family?.content as Record<string, unknown> | undefined)?.title as string | undefined) ||
        ((family?.content as Record<string, unknown> | undefined)?.name as string | undefined) ||
        ((upstream?.content as Record<string, unknown> | undefined)?.title as string | undefined) ||
        ((upstream?.content as Record<string, unknown> | undefined)?.name as string | undefined) ||
        ((base?.content as Record<string, unknown> | undefined)?.title as string | undefined) ||
        ((base?.content as Record<string, unknown> | undefined)?.name as string | undefined) ||
        code;

      // Caso 1: Item novo adicionado pelo autor no upstream
      if (!base && !family && upstream) {
        mergedItems.push(upstream);
        diffItems.push({
          definitionType: type,
          code,
          name: itemName,
          action: 'ADDED_BY_AUTHOR',
          description: 'Novo item disponibilizado pelo autor nesta versão.',
        });
        addedCount++;
        continue;
      }

      // Caso 2: Item criado localmente pela família
      if (!base && family && !upstream) {
        mergedItems.push(family);
        diffItems.push({
          definitionType: type,
          code,
          name: itemName,
          action: 'PRESERVED_FAMILY_EDIT',
          description: 'Item criado exclusivamente pela família.',
        });
        preservedFamilyEditsCount++;
        continue;
      }

      // Caso 3: Presente na família, mas não mais no upstream
      if (family && !upstream) {
        mergedItems.push(family);
        diffItems.push({
          definitionType: type,
          code,
          name: itemName,
          action: 'PRESERVED_FAMILY_EDIT',
          description: 'Mantido no currículo da família para preservar o histórico.',
        });
        preservedFamilyEditsCount++;
        continue;
      }

      // Caso 4: Presente na base e no upstream, mas removido pela família
      if (base && !family && upstream) {
        diffItems.push({
          definitionType: type,
          code,
          name: itemName,
          action: 'PRESERVED_FAMILY_EDIT',
          description: 'Item removido pela família mantido como excluído.',
        });
        preservedFamilyEditsCount++;
        continue;
      }

      // Caso 5: Presente na família e no upstream
      if (family && upstream) {
        const baseContentStr = base ? canonicalJsonStringify(base.content) : null;
        const familyContentStr = canonicalJsonStringify(family.content);
        const upstreamContentStr = canonicalJsonStringify(upstream.content);

        const familyModified = baseContentStr !== familyContentStr;
        const upstreamModified =
          baseContentStr !== upstreamContentStr || (base !== undefined && base.version !== upstream.version);

        if (!familyModified && !upstreamModified) {
          // Ninguém alterou o conteúdo: mantém upstream
          mergedItems.push(upstream);
        } else if (!familyModified && upstreamModified) {
          // Apenas o autor alterou: aplica atualização do upstream
          mergedItems.push(upstream);
          diffItems.push({
            definitionType: type,
            code,
            name: itemName,
            action: 'UPDATED_BY_AUTHOR',
            description: 'Atualizado com melhorias do autor.',
          });
          updatedCount++;
        } else if (familyModified && !upstreamModified) {
          // Apenas a família alterou: preserva a família
          mergedItems.push(family);
          diffItems.push({
            definitionType: type,
            code,
            name: itemName,
            action: 'PRESERVED_FAMILY_EDIT',
            description: 'Customização pedagógica da família preservada.',
          });
          preservedFamilyEditsCount++;
        } else {
          // Ambos alteraram (CONFLITO): prevalência soberana da família
          mergedItems.push(family);
          diffItems.push({
            definitionType: type,
            code,
            name: itemName,
            action: 'CONFLICT_PRESERVED_FAMILY',
            description: 'Conflito detectado: prevalência da adaptação realizada pela família.',
          });
          conflictsCount++;
        }
      }
    }

    const hasUpdate =
      upstreamDoc.pack.version > baseDoc.pack.version ||
      addedCount > 0 ||
      updatedCount > 0;

    const diffReport: PackDiffReport = {
      hasUpdate,
      currentVersion: baseDoc.pack.version,
      latestVersion: upstreamDoc.pack.version,
      sourcePackCode: baseDoc.pack.code,
      items: diffItems,
      summary: {
        addedCount,
        updatedCount,
        preservedFamilyEditsCount,
        conflictsCount,
      },
    };

    const docWithoutChecksum: CurriculumPackExportDocument = {
      formatVersion: upstreamDoc.formatVersion,
      exportedAt: new Date().toISOString(),
      pack: {
        ...upstreamDoc.pack,
        metadata: {
          ...(upstreamDoc.pack.metadata || {}),
          mergedAt: new Date().toISOString(),
          preservedFamilyEdits: preservedFamilyEditsCount,
        },
      },
      dependencies: upstreamDoc.dependencies,
      items: mergedItems,
    };

    const mergedDocument: CurriculumPackExportDocument = {
      ...docWithoutChecksum,
      checksumSha256: calculatePackChecksum(docWithoutChecksum),
    };

    return { mergedDocument, diffReport };
  }
}
