import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 19 seed data: "Plantio" -- Produção ---
//
// The `GARDENING` LearningDomain already exists (PR #136), with
// `GARDENING.FOUNDATIONS` as its sole LearningPath so far. This adds the
// domain's second subsection as a sibling LearningPath -- Produção
// (GARDENING.PRODUCTION) -- first of 2 sibling PRs covering issue #95
// section 19's three remaining subsections (last: Manejo + Planejamento,
// combined given their smaller item counts).
//
// Item list taken verbatim from issue #95 section 19, subsection
// "Produção": horta, hortaliças, temperos, frutas, plantas alimentícias,
// cultivo em vasos, pequenos espaços, agricultura urbana -- eight items,
// one competency each, matching the established "one competency per
// enumerated topic" granularity.
//
// Scope-neutrality:
//   - Does not repeat GARDENING.FOUNDATIONS' germination/soil/substrate/
//     nutrient/composting/irrigation/light/lifecycle competencies -- every
//     objective here assumes that biological foundation already exists and
//     moves straight to what/where you grow.
//   - Stays out of Culinária's (COOKING domain) territory: growing,
//     harvesting and identifying edible plants is in scope; cooking
//     technique, recipes and food preparation are not.
//   - Stays out of Ofícios' (TRADES domain) tool-safety territory: tools
//     (e.g. a trowel, a watering can) are referenced only conceptually
//     where naturally needed for a gardening task, never as a tool-safety
//     lesson in themselves.
//   - Stays out of Manejo/Planejamento (this domain's own remaining
//     subsections, next PR): pest control, harvesting technique,
//     storage/preservation and planning/record-keeping are deliberately
//     left out of every objective below.
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed.

const DOMAIN_CODE = 'GARDENING';
const PATH_CODE = 'GARDENING.PRODUCTION';

export interface GardeningProductionDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface GardeningProductionPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface GardeningProductionCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface GardeningProductionSeedData {
  domain: GardeningProductionDomainSeed;
  path: GardeningProductionPathSeed;
  competencies: GardeningProductionCompetencySeed[];
}

export function buildGardeningProductionSeedData(): GardeningProductionSeedData {
  return {
    // Identical to gardening-formation.seed-data.ts's domain seed --
    // reused here only as a defensive fallback in case this seeder runs
    // before GardeningFormationSeeder. Whichever runs first creates the
    // domain; the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Plantio',
      description:
        'Formação em plantio como disciplina própria -- começando pela base biológica e prática que sustenta qualquer cultivo (germinação, solo, nutrientes, água, luz, ciclo de vida das plantas), antes de qualquer especialização em produção, manejo contínuo ou planejamento de cultivo (cada uma, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    path: {
      code: PATH_CODE,
      name: 'Produção',
      description:
        'Trilha de produção -- horta, hortaliças, temperos, frutas, plantas alimentícias, cultivo em vasos, pequenos espaços e agricultura urbana, sobre a base biológica de Fundamentos de Plantio (issue #95 seção 19, subseção "Produção").',
    },
    competencies: [
      {
        code: 'GARDENING.PRODUCTION.VEGETABLE_GARDEN',
        title: 'Horta',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Planejar e ajudar a montar um canteiro ou horta simples, registrando em fotos as etapas da montagem',
          'Explicar com as próprias palavras o que uma horta precisa para funcionar bem (espaço, luz, água, cuidado regular)',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.VEGETABLES',
        title: 'Hortaliças',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Plantar e acompanhar o ciclo completo de uma hortaliça de crescimento rápido (ex.: alface, rabanete), registrando observações semanais até que a planta esteja pronta para o consumo',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.HERBS_SPICES',
        title: 'Temperos',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Cultivar pelo menos duas ervas ou temperos (ex.: manjericão, hortelã, cebolinha), identificando-os pelo aroma e pela aparência das folhas',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.FRUITS',
        title: 'Frutas',
        level: 2,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['photo', 'text', 'observation'],
        starterObjectives: [
          'Acompanhar o desenvolvimento de uma planta frutífera (em vaso ou no solo) por pelo menos um mês, registrando as mudanças observadas e explicando o que ela precisa para frutificar',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.EDIBLE_PLANTS',
        title: 'Plantas Alimentícias',
        level: 2,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Identificar e catalogar, com fotos ou desenhos, pelo menos cinco plantas alimentícias diferentes (hortaliça, tempero, fruta ou outra), explicando qual parte de cada uma é comestível',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.CONTAINER_GROWING',
        title: 'Cultivo em Vasos',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Plantar e cuidar de uma planta em vaso, explicando por que o tamanho do vaso e a drenagem importam para o crescimento saudável da planta',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.SMALL_SPACES',
        title: 'Pequenos Espaços',
        level: 2,
        ageRecommendation: { min: 9, max: 14 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Planejar, no papel ou em fotos, como aproveitar um espaço pequeno (varanda, parapeito de janela, quintal reduzido) para cultivar o máximo possível de plantas',
        ],
      },
      {
        code: 'GARDENING.PRODUCTION.URBAN_AGRICULTURE',
        title: 'Agricultura Urbana',
        level: 2,
        ageRecommendation: { min: 9, max: 14 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Pesquisar e explicar com as próprias palavras o que é agricultura urbana e apresentar pelo menos um exemplo real (horta comunitária, telhado verde, feira local) observado ou pesquisado',
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

export function buildGardeningProductionDomainDto(
  seed: GardeningProductionDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildGardeningProductionPathDto(
  seed: GardeningProductionPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildGardeningProductionCompetencyDto(
  seed: GardeningProductionCompetencySeed,
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
