import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 18 seed data: "Culinária" (fundamentos) ---
//
// Same pattern as biblical-formation.seed-data.ts (issue #95 section 5,
// PR #131), music-formation.seed-data.ts (issue #95 section 13, PR
// #132), and trades-formation.seed-data.ts (issue #95 section 15, PR
// #134): a new, richer Domain -> Path -> Competency slice, not a
// migration of pre-existing hardcoded content. The pre-existing "Ofícios
// Práticos" subject in curriculum-template.engine.ts's
// ARTS_TRADES_VOCATION_SUBJECTS already mentions "culinária" as one word
// inside a broader catch-all stub and still drives applyTemplate's
// legacy plan -- this domain is the real, separately trackable Culinária
// content, and both coexist.
//
// Scope is deliberately limited to section 18's "Fundamentos" subsection
// only: higiene, segurança alimentar, uso seguro de facas e utensílios,
// organização da cozinha, pesos e medidas, receitas, técnicas básicas --
// seven competencies, one per Fundamentos item, matching the "one
// competency per enumerated topic" granularity already used for
// biblical-formation.
//
// Two other subsections of section 18 are explicitly NOT covered here,
// per the task's own instruction:
//   - "Progressão" (panificação, massas, carnes, vegetais, sobremesas,
//     conservação, fermentação, aproveitamento integral, planejamento de
//     refeições) -- these are technique specializations that build on
//     this foundation, future follow-up work, not squeezed into this
//     slice.
//   - "Vida prática" (lista de compras, orçamento, custo por refeição,
//     organização de despensa, estoque doméstico, nutrição básica,
//     planejamento alimentar familiar) -- closer to educação financeira/
//     vida prática than to hands-on cooking technique; the exact domain
//     boundary for that content is a separate, not-yet-made decision, so
//     it's left out entirely here rather than guessed at.
//
// Every objective below is deliberately technique-neutral -- knife
// handling, measuring, reading a recipe, basic prep verbs (picar,
// misturar, refogar) -- never a specific dish category or preservation
// method, so this domain stays a genuine prerequisite for whatever
// Progressão follow-up eventually gets built rather than smuggling a
// technique specialization in early.

const DOMAIN_CODE = 'COOKING';
const PATH_CODE = 'COOKING.FOUNDATIONS';

export interface CookingFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface CookingFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface CookingFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface CookingFormationSeedData {
  domain: CookingFormationDomainSeed;
  path: CookingFormationPathSeed;
  competencies: CookingFormationCompetencySeed[];
}

export function buildCookingFormationSeedData(): CookingFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Culinária',
      description:
        'Formação culinária como disciplina própria -- começando pela base de higiene, segurança alimentar, uso de utensílios e método que qualquer preparo exige, antes de qualquer especialização técnica específica (cada uma, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Culinária',
      description:
        'Trilha fundamental de culinária -- higiene, segurança alimentar, uso seguro de facas e utensílios, organização da cozinha, pesos e medidas, leitura de receitas e técnicas básicas de preparo -- antes de qualquer especialização técnica (issue #95 seção 18, subseção "Fundamentos").',
    },
    competencies: [
      {
        code: 'COOKING.FOUNDATIONS.HYGIENE',
        title: 'Higiene',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar a lavagem correta das mãos antes de manusear alimentos, explicando por que cada etapa importa',
          'Manter unhas, cabelo preso e roupas adequadas durante o preparo de alimentos',
        ],
      },
      {
        code: 'COOKING.FOUNDATIONS.FOOD_SAFETY',
        title: 'Segurança Alimentar',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Identificar sinais de que um alimento não está seguro para consumo (validade, temperatura, aparência, cheiro)',
          'Armazenar corretamente um alimento perecível na geladeira ou despensa, explicando o motivo',
        ],
      },
      {
        code: 'COOKING.FOUNDATIONS.KNIFE_SAFETY',
        title: 'Uso Seguro de Facas e Utensílios',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar a postura e o manuseio seguro de uma faca de cozinha apropriada para a idade, com supervisão de um adulto responsável',
        ],
      },
      {
        code: 'COOKING.FOUNDATIONS.KITCHEN_ORGANIZATION',
        title: 'Organização da Cozinha',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Organizar o espaço de trabalho antes de cozinhar (separar ingredientes e utensílios) e deixá-lo limpo e organizado ao final',
        ],
      },
      {
        code: 'COOKING.FOUNDATIONS.MEASURING',
        title: 'Pesos e Medidas',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Medir corretamente ingredientes usando xícaras, colheres medidoras ou balança de cozinha, seguindo uma receita',
        ],
      },
      {
        code: 'COOKING.FOUNDATIONS.RECIPES',
        title: 'Receitas',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Ler e seguir uma receita simples do início ao fim, identificando ingredientes, quantidades e a sequência de passos',
        ],
      },
      {
        code: 'COOKING.FOUNDATIONS.BASIC_TECHNIQUES',
        title: 'Técnicas Básicas',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Demonstrar pelo menos duas técnicas básicas de preparo (ex.: picar, misturar, refogar) com segurança e supervisão',
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

export function buildCookingFormationDomainDto(seed: CookingFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildCookingFormationPathDto(
  seed: CookingFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildCookingFormationCompetencyDto(
  seed: CookingFormationCompetencySeed,
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
