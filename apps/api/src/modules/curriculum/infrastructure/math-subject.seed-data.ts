import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Core academic subject seed data: "Matemática" ---
//
// New priority (decided directly with the human, not from issue #95's
// enrichment/pedagogical/theological checklist): populate core academic
// subjects as real, competency-trackable catalog content. The six
// enrichment domains seeded so far (biblical formation #131, music #132,
// trades #134, cooking #135, gardening #136, resilience #141) cover none
// of what most homeschool families actually spend most of their time on
// -- without core subjects, the whole competency-tracking system (Fase
// 5, issue #126) stays a side feature nobody's main curriculum touches.
// Matemática is the first of five planned subjects (Português, História,
// Geografia, Ciências follow as separate tasks).
//
// Shape difference from every prior seed: the six enrichment domains
// each had one flat "foundational tier" LearningPath. Academic subjects
// need real grade/age progression -- math for a 6-year-old and a
// 14-year-old are genuinely different competencies, not the same tier.
// So this domain has MULTIPLE LearningPaths, one per grade band, each
// with its own competencies.
//
// Grade-band naming aligns with this codebase's existing
// EducationalStage convention (apps/api/prisma/schema.prisma,
// packages/contracts/src/learner.ts) rather than inventing new
// terminology -- the exact Portuguese labels already shown to families
// in apps/web/src/components/learners/learner-form-modal.tsx:
//   EARLY_YEARS      -> "Educação Infantil (Early Years)"
//   PRIMARY_GRAMMAR  -> "Ensino Fundamental I (Grammar)"
//   MIDDLE_LOGIC     -> "Ensino Fundamental II (Logic)"
//   HIGH_RHETORIC    -> "Ensino Médio (Rhetoric)"
// Each LearningPath's code embeds the matching EducationalStage value
// (e.g. MATH.PRIMARY_GRAMMAR) so a future "suggest a path for this
// learner's stage" feature has an exact, non-guessed join key.
//
// This first slice covers two bands -- PRIMARY_GRAMMAR (Ensino
// Fundamental I, roughly ages 6-10) and MIDDLE_LOGIC (Ensino Fundamental
// II, roughly ages 11-14) -- with seven competencies each, per the task's
// explicit "2-3 grade bands with 5-8 competencies each" scoping
// instruction. EARLY_YEARS and HIGH_RHETORIC are explicitly NOT covered
// here and remain follow-up work, same as every prior seed's documented
// scope boundary.
//
// Pre-existing content: curriculum-template.engine.ts has a flat
// "Matemática" Subject stub in both the TRADITIONAL and CLASSICAL_TRIVIUM
// frameworks (description: "Aritmética, raciocínio quantitativo, medidas
// e geometria introdutória" / "Cálculo mental, quatro operações
// fundamentais, frações e resolução lógica de problemas") and still
// drives applyTemplate's legacy plan for those frameworks. This domain
// doesn't touch or duplicate it -- both coexist, same as every prior
// content slice. The tone/scope below was cross-checked against that
// stub's starter objectives (arithmetic fluency, fractions/decimals/
// percentages, multi-step problem solving) to stay consistent.

const DOMAIN_CODE = 'MATH';
const PRIMARY_GRAMMAR_PATH_CODE = 'MATH.PRIMARY_GRAMMAR';
const MIDDLE_LOGIC_PATH_CODE = 'MATH.MIDDLE_LOGIC';

export interface MathSubjectDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface MathSubjectPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface MathSubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface MathSubjectPathSeedData {
  path: MathSubjectPathSeed;
  competencies: MathSubjectCompetencySeed[];
}

export interface MathSubjectSeedData {
  domain: MathSubjectDomainSeed;
  paths: MathSubjectPathSeedData[];
}

export function buildMathSubjectSeedData(): MathSubjectSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Matemática',
      description:
        'Raciocínio quantitativo, aritmética, geometria e resolução de problemas, com progressão real por faixa de idade/série -- cada trilha deste domínio corresponde a um estágio educacional (issue #96 EducationalStage), não um único nível único para todas as idades.',
    },
    paths: [
      {
        path: {
          code: PRIMARY_GRAMMAR_PATH_CODE,
          name: 'Matemática -- Ensino Fundamental I (Grammar)',
          description:
            'Matemática para o Ensino Fundamental I (aproximadamente 6 a 10 anos) -- contagem, as quatro operações fundamentais em nível inicial, noções de tempo e dinheiro, formas geométricas e medidas básicas.',
        },
        competencies: [
          {
            code: 'MATH.PRIMARY_GRAMMAR.COUNTING',
            title: 'Contagem e Sistema Numérico',
            level: 1,
            ageRecommendation: { min: 6, max: 8 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Contar, ler e escrever números até 1000, identificando o valor posicional de centena, dezena e unidade',
              'Ordenar e comparar números usando os símbolos de maior, menor e igual',
            ],
          },
          {
            code: 'MATH.PRIMARY_GRAMMAR.ADDITION_SUBTRACTION',
            title: 'Adição e Subtração',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Resolver operações de adição e subtração com números de até três algarismos, com e sem reagrupamento',
              'Resolver um problema do cotidiano usando adição ou subtração, explicando o raciocínio',
            ],
          },
          {
            code: 'MATH.PRIMARY_GRAMMAR.MULTIPLICATION_DIVISION_INTRO',
            title: 'Multiplicação e Divisão Iniciais',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Demonstrar a ideia de multiplicação como soma de parcelas iguais, resolvendo multiplicações simples (tabuada até 5)',
              'Resolver uma divisão simples repartindo uma quantidade em partes iguais',
            ],
          },
          {
            code: 'MATH.PRIMARY_GRAMMAR.TIME',
            title: 'Noções de Tempo',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Ler as horas em um relógio analógico e em um relógio digital',
              'Identificar dias da semana, meses e datas em um calendário',
            ],
          },
          {
            code: 'MATH.PRIMARY_GRAMMAR.MONEY',
            title: 'Noções de Dinheiro',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Reconhecer cédulas e moedas do sistema monetário brasileiro e calcular o total de uma quantia simples',
              'Simular uma compra simples, calculando o troco com valores redondos',
            ],
          },
          {
            code: 'MATH.PRIMARY_GRAMMAR.SHAPES',
            title: 'Formas Geométricas Básicas',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Identificar e nomear formas geométricas básicas (círculo, quadrado, triângulo, retângulo) em objetos do cotidiano',
            ],
          },
          {
            code: 'MATH.PRIMARY_GRAMMAR.MEASUREMENT',
            title: 'Medidas Básicas',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Medir comprimentos usando uma régua ou fita métrica, registrando o resultado em centímetros',
              'Comparar e ordenar objetos por comprimento, massa ou capacidade',
            ],
          },
        ],
      },
      {
        path: {
          code: MIDDLE_LOGIC_PATH_CODE,
          name: 'Matemática -- Ensino Fundamental II (Logic)',
          description:
            'Matemática para o Ensino Fundamental II (aproximadamente 11 a 14 anos) -- frações e decimais, porcentagem, geometria plana, equações do primeiro grau, proporção, estatística básica e números negativos.',
        },
        competencies: [
          {
            code: 'MATH.MIDDLE_LOGIC.FRACTIONS_DECIMALS',
            title: 'Frações e Números Decimais',
            level: 2,
            ageRecommendation: { min: 10, max: 12 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Resolver operações de adição e subtração com frações e com números decimais',
              'Converter entre frações e números decimais, explicando a equivalência',
            ],
          },
          {
            code: 'MATH.MIDDLE_LOGIC.PERCENTAGE',
            title: 'Porcentagem',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Calcular a porcentagem de uma quantidade em uma situação do cotidiano (ex.: desconto em uma compra)',
            ],
          },
          {
            code: 'MATH.MIDDLE_LOGIC.PLANE_GEOMETRY',
            title: 'Geometria Plana',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Calcular o perímetro e a área de figuras planas simples (quadrado, retângulo, triângulo)',
            ],
          },
          {
            code: 'MATH.MIDDLE_LOGIC.LINEAR_EQUATIONS',
            title: 'Equações do Primeiro Grau',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Resolver uma equação do primeiro grau com uma incógnita, verificando a solução por substituição',
            ],
          },
          {
            code: 'MATH.MIDDLE_LOGIC.RATIO_PROPORTION',
            title: 'Razão, Proporção e Regra de Três',
            level: 2,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Resolver um problema usando regra de três simples, explicando o raciocínio proporcional',
            ],
          },
          {
            code: 'MATH.MIDDLE_LOGIC.STATISTICS',
            title: 'Estatística Básica',
            level: 2,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Calcular a média de um conjunto de dados e interpretar um gráfico simples (barras ou linhas)',
            ],
          },
          {
            code: 'MATH.MIDDLE_LOGIC.NEGATIVE_NUMBERS',
            title: 'Números Negativos e Operações',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Resolver operações de adição e subtração envolvendo números negativos, representando-os em uma reta numérica',
            ],
          },
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

export function buildMathSubjectDomainDto(seed: MathSubjectDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildMathSubjectPathDto(
  seed: MathSubjectPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildMathSubjectCompetencyDto(
  seed: MathSubjectCompetencySeed,
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
