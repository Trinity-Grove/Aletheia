import type {
  PedagogicalFramework,
  PedagogicalModelApproach,
  RecommendedAgeRange,
  TemplateSubjectDefinition,
  UniversalEducationalStage,
} from '@aletheia/contracts';
import { CurriculumTemplateEngine } from './curriculum-template.engine.js';

// --- Fase 0 seed data for pedagogical_model_definitions (issue #96) ---
//
// Deliberately reuses `CurriculumTemplateEngine.getTemplateDefinitions()` --
// the exact same Portuguese content PR #94 wrote -- as the source of each
// row's `metadata.subjects`, instead of retyping it. This both avoids
// drift between the old switch-case and the new data rows, and makes the
// equivalence proof (pedagogical-model-definition.integration-spec.ts)
// close to definitional: the seed *is* a call to the old engine, and the
// new resolver is checked to round-trip it losslessly through Postgres.
//
// `CUSTOM` has no template content of its own in the old engine (it falls
// through to TRADITIONAL) — it is intentionally not seeded as its own row
// here; the framework name/description below stand in for what the old
// switch-case comment described for each case.
type FrameworkDiscoveryMetadata = {
  name: string;
  description: string;
  approach: PedagogicalModelApproach;
  recommendedAgeRange: RecommendedAgeRange;
  educationalStages: UniversalEducationalStage[];
};

const FRAMEWORK_METADATA: Record<Exclude<PedagogicalFramework, 'CUSTOM'>, FrameworkDiscoveryMetadata> = {
  CLASSICAL_TRIVIUM: {
    name: 'Educação Clássica (Trivium)',
    description: 'Gramática, lógica e retórica como progressão formativa, com ênfase em línguas clássicas, história ocidental e literatura.',
    approach: 'CLASSICAL_TRIVIUM',
    recommendedAgeRange: { min: 6, max: 18 },
    educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
  CHARLOTTE_MASON: {
    name: 'Charlotte Mason',
    description: 'Livros vivos, narração, estudo da natureza e formação de hábitos e caráter.',
    approach: 'CHARLOTTE_MASON',
    recommendedAgeRange: { min: 6, max: 18 },
    educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
  TRADITIONAL: {
    name: 'Escolar Tradicional',
    description: 'Disciplinas escolares convencionais (Português, Matemática, História, Geografia, Ciências) em sequência estruturada.',
    approach: 'TRADITIONAL',
    recommendedAgeRange: { min: 6, max: 18 },
    educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
  UNIT_STUDIES: {
    name: 'Unit Studies',
    description: 'Um tema central explorado de forma interdisciplinar, ancorando literatura, matemática, ciências e história.',
    approach: 'UNIT_STUDIES',
    recommendedAgeRange: { min: 5, max: 18 },
    educationalStages: ['EARLY_YEARS', 'PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
  MONTESSORI: {
    name: 'Montessori',
    description: 'Vida prática, educação sensorial e materiais concretos, partindo da autonomia e da experiência direta da criança.',
    approach: 'MONTESSORI',
    recommendedAgeRange: { min: 3, max: 12 },
    educationalStages: ['EARLY_YEARS', 'PRIMARY', 'LOWER_SECONDARY'],
  },
  PROJECT_BASED: {
    name: 'Aprendizagem Baseada em Projetos',
    description: 'Um projeto real e significativo conduz o aprendizado, do planejamento à entrega final.',
    approach: 'PROJECT_BASED',
    recommendedAgeRange: { min: 8, max: 18 },
    educationalStages: ['PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
  GUIDED_UNSCHOOLING: {
    name: 'Unschooling Guiado',
    description: 'Interesses do aluno como eixo do aprendizado, com mediação e acompanhamento ativo dos pais.',
    approach: 'GUIDED_UNSCHOOLING',
    recommendedAgeRange: { min: 4, max: 18 },
    educationalStages: ['EARLY_YEARS', 'PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
  ECLECTIC: {
    name: 'Eclético',
    description: 'Combinação livre de abordagens e métodos, ajustada ao que melhor funciona para o aluno.',
    approach: 'ECLECTIC',
    recommendedAgeRange: { min: 3, max: 18 },
    educationalStages: ['EARLY_YEARS', 'PRIMARY', 'LOWER_SECONDARY', 'UPPER_SECONDARY'],
  },
};

export interface PedagogicalModelDefinitionSeedRow {
  code: Exclude<PedagogicalFramework, 'CUSTOM'>;
  name: string;
  description: string;
  subjects: TemplateSubjectDefinition[];
  approach: PedagogicalModelApproach;
  recommendedAgeRange: RecommendedAgeRange;
  educationalStages: UniversalEducationalStage[];
}

export function buildPedagogicalModelDefinitionSeedRows(
  engine: CurriculumTemplateEngine = new CurriculumTemplateEngine(),
): PedagogicalModelDefinitionSeedRow[] {
  return (Object.keys(FRAMEWORK_METADATA) as (keyof typeof FRAMEWORK_METADATA)[]).map((code) => ({
    code,
    name: FRAMEWORK_METADATA[code].name,
    description: FRAMEWORK_METADATA[code].description,
    subjects: engine.getTemplateDefinitions(code),
    approach: FRAMEWORK_METADATA[code].approach,
    recommendedAgeRange: FRAMEWORK_METADATA[code].recommendedAgeRange,
    educationalStages: FRAMEWORK_METADATA[code].educationalStages,
  }));
}
