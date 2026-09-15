import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 18 seed data: "Culinária" (Progressão) ---
//
// The `COOKING` LearningDomain already exists (PR #135) with
// `COOKING.FOUNDATIONS` as its sole LearningPath. This adds the
// "Progressão" subsection as a second, sibling LearningPath
// (`COOKING.PROGRESSION`) -- pure technique-progression content, safe to
// build immediately per this task's own framing (unlike "Vida prática",
// the other remaining section 18 subsection, whose domain boundary
// required a separate decision -- see cooking-life-skills.seed-data.ts).
//
// Item list taken verbatim from issue #95 section 18, subsection
// "Progressão": preparação de refeições, panificação, massas, carnes,
// vegetais, sobremesas, conservação, fermentação (quando apropriado),
// aproveitamento integral, planejamento de refeições -- ten items, one
// competency per item, matching the "one competency per enumerated topic"
// granularity already used across biblical-formation, cooking-formation,
// resilience-water-fire, etc.
//
// Every objective below builds on -- and assumes -- the foundational
// tier (higiene, segurança alimentar, facas, organização, medidas,
// receitas, técnicas básicas), but is itself technique-neutral within its
// own category: e.g. BREAD_MAKING asks for "preparar um pão simples do
// início ao fim, incluindo fermentação" rather than any specific recipe
// or bread style, so the competency stays a genuine skill milestone
// rather than a recipe-following exercise. Higher-risk items (raw meat
// handling, oven/stovetop use) carry adult-supervision framing,
// consistent with the project's child-safety principle (issue #95
// section 35) and the tone already established in cooking-formation and
// resilience-water-fire.
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed.

const DOMAIN_CODE = 'COOKING';
const PATH_CODE = 'COOKING.PROGRESSION';

export interface CookingProgressionDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface CookingProgressionPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface CookingProgressionCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface CookingProgressionSeedData {
  domain: CookingProgressionDomainSeed;
  path: CookingProgressionPathSeed;
  competencies: CookingProgressionCompetencySeed[];
}

export function buildCookingProgressionSeedData(): CookingProgressionSeedData {
  return {
    // Identical to cooking-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // CookingFormationSeeder. Whichever runs first creates the domain;
    // the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Culinária',
      description:
        'Formação culinária como disciplina própria -- começando pela base de higiene, segurança alimentar, uso de utensílios e método que qualquer preparo exige, antes de qualquer especialização técnica específica (cada uma, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    path: {
      code: PATH_CODE,
      name: 'Progressão Culinária',
      description:
        'Trilha de progressão de técnicas -- preparação de refeições, panificação, massas, carnes, vegetais, sobremesas, conservação, fermentação, aproveitamento integral e planejamento de refeições -- construída sobre a base de Fundamentos de Culinária (issue #95 seção 18, subseção "Progressão").',
    },
    competencies: [
      {
        code: 'COOKING.PROGRESSION.MEAL_PREPARATION',
        title: 'Preparação de Refeições',
        level: 2,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Preparar uma refeição simples do início ao fim, aplicando as técnicas de higiene, medidas e organização já dominadas na trilha de Fundamentos',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.BREAD_MAKING',
        title: 'Panificação',
        level: 2,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Preparar um pão simples do início ao fim, incluindo fermentação, com apoio de um adulto responsável ao usar o forno',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.PASTA_DOUGH',
        title: 'Massas',
        level: 2,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Preparar uma massa simples (ex.: macarrão caseiro ou massa de pão de pizza) do início ao fim, incluindo sova e tempo de descanso',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.MEAT_PREPARATION',
        title: 'Carnes',
        level: 2,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Preparar um prato simples com carne, demonstrando manuseio seguro do alimento cru e cozimento adequado, sempre com supervisão direta de um adulto responsável',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.VEGETABLE_PREPARATION',
        title: 'Vegetais',
        level: 2,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Preparar vegetais usando pelo menos duas técnicas diferentes de corte e cocção, mantendo textura e sabor apropriados ao prato',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.DESSERTS',
        title: 'Sobremesas',
        level: 2,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Preparar uma sobremesa simples do início ao fim, aplicando as técnicas de medição e uso do forno já dominadas',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.FOOD_PRESERVATION',
        title: 'Conservação',
        level: 2,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Aplicar um método simples de conservação de alimentos (ex.: refrigeração adequada, congelamento, conserva caseira básica), explicando por que ele prolonga a validade do alimento com segurança',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.FERMENTATION',
        title: 'Fermentação',
        level: 2,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Conduzir, quando apropriado, um processo simples de fermentação (ex.: massa de pão, iogurte caseiro), explicando o papel dos microrganismos envolvidos e os cuidados de higiene necessários',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.FULL_INGREDIENT_USE',
        title: 'Aproveitamento Integral',
        level: 2,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Planejar e preparar um prato que aproveite integralmente um ingrediente (ex.: cascas, talos, sobras), reduzindo o desperdício de alimentos',
        ],
      },
      {
        code: 'COOKING.PROGRESSION.MEAL_PLANNING',
        title: 'Planejamento de Refeições',
        level: 2,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Planejar e executar um cardápio semanal simples para a família, considerando variedade, praticidade e os ingredientes disponíveis',
        ],
      },
    ],
  };
}

// Builders below parse every row through the exact same Zod schemas the
// admin API's ZodValidationPipe applies -- this seed data is validated no
// differently than a real admin request would be. domainId/pathId aren't
// knowable until the domain/path rows actually exist (Postgres assigns
// the id), so they're injected here rather than baked into the seed data
// above.

export function buildCookingProgressionDomainDto(
  seed: CookingProgressionDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildCookingProgressionPathDto(
  seed: CookingProgressionPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildCookingProgressionCompetencyDto(
  seed: CookingProgressionCompetencySeed,
  domainId: string,
  pathId: string,
): CreateCompetencyDefinitionOutput {
  return createCompetencyDefinitionSchema.parse({
    code: seed.code,
    title: seed.title,
    level: seed.level,
    domainId,
    pathId,
    metadata: {
      ageRecommendation: seed.ageRecommendation,
      evidenceTypes: seed.evidenceTypes,
      starterObjectives: seed.starterObjectives,
    },
  });
}
