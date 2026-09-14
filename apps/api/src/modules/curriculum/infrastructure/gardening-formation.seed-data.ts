import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 19 seed data: "Plantio" (fundamentos) ---
//
// Same pattern as biblical-formation.seed-data.ts (issue #95 section 5,
// PR #131), music-formation.seed-data.ts (issue #95 section 13, PR
// #132), trades-formation.seed-data.ts (issue #95 section 15, PR #134),
// and cooking-formation.seed-data.ts (issue #95 section 18, PR #135): a
// new, richer Domain -> Path -> Competency slice, not a migration of
// pre-existing hardcoded content. No pre-existing Subject stub mentions
// plantio/cultivo, so this domain has no coexistence concern the way the
// prior four had with ARTS_TRADES_VOCATION_SUBJECTS/
// FAITH_AND_THEOLOGY_SUBJECTS.
//
// Naming: the issue section itself is titled "Plantio e produção de
// alimentos"; "Plantio" was picked over "Cultivo" for the domain name to
// keep the same "one word matching the issue section title" convention
// already used for Culinária (section 18) and Ofícios (section 15).
//
// Scope is deliberately limited to section 19's "Fundamentos" subsection
// only: germinação, sementes, solo, substratos, nutrientes, compostagem,
// irrigação, luz, ciclo das plantas -- nine competencies, one per
// Fundamentos item, matching the established "one competency per
// enumerated topic" granularity.
//
// Three other subsections of section 19 are explicitly NOT covered here,
// per the task's own instruction:
//   - "Produção" (horta, hortaliças, temperos, frutas, cultivo em vasos,
//     pequenos espaços, agricultura urbana) -- what you actually grow,
//     future follow-up work once this biological/practical foundation
//     exists.
//   - "Manejo" (controle de pragas, manejo sustentável, colheita,
//     armazenamento, conservação) -- ongoing-care and harvest
//     competencies that build on this foundation, not part of it.
//   - "Planejamento" (calendário de plantio, registro de cultivo, diário
//     da horta, medição de produtividade, projeto de horta familiar) --
//     the record-keeping/project layer on top, future follow-up.
//
// Every objective below is deliberately neutral to all three excluded
// subsections -- germination, soil, substrate, nutrients, watering,
// light and life-cycle observation using any generic plant or seed, never
// a specific crop, harvest technique, or garden-planning artifact -- so
// this domain stays a genuine prerequisite for whatever Produção/Manejo/
// Planejamento follow-up eventually gets built rather than smuggling one
// of them in early.

const DOMAIN_CODE = 'GARDENING';
const PATH_CODE = 'GARDENING.FOUNDATIONS';

export interface GardeningFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface GardeningFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface GardeningFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface GardeningFormationSeedData {
  domain: GardeningFormationDomainSeed;
  path: GardeningFormationPathSeed;
  competencies: GardeningFormationCompetencySeed[];
}

export function buildGardeningFormationSeedData(): GardeningFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Plantio',
      description:
        'Formação em plantio como disciplina própria -- começando pela base biológica e prática que sustenta qualquer cultivo (germinação, solo, nutrientes, água, luz, ciclo de vida das plantas), antes de qualquer especialização em produção, manejo contínuo ou planejamento de cultivo (cada uma, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Plantio',
      description:
        'Trilha fundamental de plantio -- germinação, sementes, solo, substratos, nutrientes, compostagem, irrigação, luz e ciclo das plantas -- antes de qualquer especialização em produção, manejo ou planejamento de cultivo (issue #95 seção 19, subseção "Fundamentos").',
    },
    competencies: [
      {
        code: 'GARDENING.FOUNDATIONS.GERMINATION',
        title: 'Germinação',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Germinar uma semente em algodão úmido ou copo com terra, registrando em fotos o processo do plantio até o surgimento das primeiras folhas',
          'Explicar com as próprias palavras as condições necessárias para uma semente germinar (água, temperatura, ar)',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.SEEDS',
        title: 'Sementes',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Identificar e comparar pelo menos três tipos diferentes de sementes quanto a tamanho, formato e cor',
          'Explicar com as próprias palavras a diferença entre semente e muda',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.SOIL',
        title: 'Solo',
        level: 1,
        ageRecommendation: { min: 7, max: 12 },
        evidenceTypes: ['photo', 'text', 'observation'],
        starterObjectives: [
          'Observar e descrever as características de uma amostra de solo (textura, cor, umidade, presença de matéria orgânica)',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.SUBSTRATES',
        title: 'Substratos',
        level: 1,
        ageRecommendation: { min: 8, max: 12 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Comparar o crescimento de uma muda em dois substratos diferentes, registrando as diferenças observadas ao longo de algumas semanas',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.NUTRIENTS',
        title: 'Nutrientes',
        level: 1,
        ageRecommendation: { min: 8, max: 12 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Explicar com as próprias palavras por que as plantas precisam de nutrientes, citando pelo menos dois exemplos',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.COMPOSTING',
        title: 'Compostagem',
        level: 1,
        ageRecommendation: { min: 8, max: 12 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Observar ou montar um processo simples de compostagem, registrando em fotos a transformação dos materiais ao longo de pelo menos duas semanas',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.IRRIGATION',
        title: 'Irrigação',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['observation', 'text'],
        starterObjectives: [
          'Demonstrar a quantidade e frequência adequadas de água para uma planta específica, explicando os sinais de excesso ou falta de água',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.LIGHT',
        title: 'Luz',
        level: 1,
        ageRecommendation: { min: 7, max: 12 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Observar e registrar como uma planta responde à quantidade de luz que recebe, comparando duas plantas em condições diferentes de luminosidade',
        ],
      },
      {
        code: 'GARDENING.FOUNDATIONS.PLANT_LIFECYCLE',
        title: 'Ciclo das Plantas',
        level: 1,
        ageRecommendation: { min: 7, max: 12 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Descrever, com apoio de desenho ou fotos, as etapas do ciclo de vida de uma planta, da semente à formação de uma nova semente',
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

export function buildGardeningFormationDomainDto(seed: GardeningFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildGardeningFormationPathDto(
  seed: GardeningFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildGardeningFormationCompetencyDto(
  seed: GardeningFormationCompetencySeed,
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
