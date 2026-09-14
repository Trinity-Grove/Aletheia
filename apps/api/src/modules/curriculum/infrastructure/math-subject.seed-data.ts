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
// PR #142 covered the first two bands -- PRIMARY_GRAMMAR (Ensino
// Fundamental I, roughly ages 6-10) and MIDDLE_LOGIC (Ensino Fundamental
// II, roughly ages 11-14), seven competencies each. Issue #144 Lote 1
// item 1 closes Matemática out with the remaining two bands:
//   - EARLY_YEARS (Educação Infantil, roughly ages 4-5): pre-arithmetic
//     foundations -- oral counting, number recognition 0-10, comparing
//     quantities, shape recognition, simple patterns. Five competencies,
//     one per item explicitly listed in the #144 task.
//   - HIGH_RHETORIC (Ensino Médio, roughly ages 15-17): the next real
//     step up from MIDDLE_LOGIC -- functions, quadratic equations,
//     plane/spatial geometry at proof level, probability, more advanced
//     statistics, intro to exponentials/logarithms. Six competencies, a
//     deliberately bounded first slice of Ensino Médio math, not a full
//     curriculum's worth in one PR.
// All four EducationalStage bands are now covered -- Matemática is
// complete as a subject (see issue #144's tracking table).
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
const EARLY_YEARS_PATH_CODE = 'MATH.EARLY_YEARS';
const PRIMARY_GRAMMAR_PATH_CODE = 'MATH.PRIMARY_GRAMMAR';
const MIDDLE_LOGIC_PATH_CODE = 'MATH.MIDDLE_LOGIC';
const HIGH_RHETORIC_PATH_CODE = 'MATH.HIGH_RHETORIC';

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
          code: EARLY_YEARS_PATH_CODE,
          name: 'Matemática -- Educação Infantil (Early Years)',
          description:
            'Matemática para a Educação Infantil (aproximadamente 4 a 5 anos) -- fundamentos pré-aritméticos: contagem oral, reconhecimento de números, comparação de quantidades, formas básicas e padrões simples, antes de qualquer operação formal.',
        },
        competencies: [
          {
            code: 'MATH.EARLY_YEARS.COUNTING_ALOUD',
            title: 'Contagem Oral de Objetos',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Contar em voz alta objetos concretos (brinquedos, blocos, dedos) até pelo menos 10, apontando para cada um ao contar',
              'Responder corretamente "quantos são" depois de contar um pequeno grupo de objetos',
            ],
          },
          {
            code: 'MATH.EARLY_YEARS.NUMBER_RECOGNITION',
            title: 'Reconhecimento e Nomeação de Números (0 a 10)',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Reconhecer e nomear os números de 0 a 10 ao vê-los escritos, em qualquer ordem',
              'Associar cada número de 0 a 10 à quantidade correspondente de objetos',
            ],
          },
          {
            code: 'MATH.EARLY_YEARS.COMPARING_QUANTITIES',
            title: 'Comparação de Quantidades (Mais/Menos/Igual)',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['observation', 'photo'],
            starterObjectives: [
              'Comparar dois grupos de objetos e dizer qual tem mais, qual tem menos, ou se têm a mesma quantidade',
            ],
          },
          {
            code: 'MATH.EARLY_YEARS.SHAPE_RECOGNITION',
            title: 'Reconhecimento de Formas Básicas',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Identificar e nomear formas básicas (círculo, quadrado, triângulo) em brinquedos e objetos do dia a dia',
            ],
          },
          {
            code: 'MATH.EARLY_YEARS.PATTERNS',
            title: 'Padrões e Sequências Simples',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Continuar um padrão simples de cores, formas ou objetos (ex.: vermelho-azul-vermelho-azul)',
              'Criar um padrão simples próprio usando objetos ou desenhos',
            ],
          },
        ],
      },
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
      {
        path: {
          code: HIGH_RHETORIC_PATH_CODE,
          name: 'Matemática -- Ensino Médio (Rhetoric)',
          description:
            'Matemática para o Ensino Médio (aproximadamente 15 a 17 anos) -- funções, equações do segundo grau, geometria plana e espacial em nível de demonstração, probabilidade, estatística avançada e introdução a exponenciais e logaritmos. Fatia inicial deliberadamente delimitada, não uma cobertura completa do currículo de Ensino Médio.',
        },
        competencies: [
          {
            code: 'MATH.HIGH_RHETORIC.FUNCTIONS',
            title: 'Funções',
            level: 3,
            ageRecommendation: { min: 15, max: 16 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Construir e interpretar o gráfico de uma função do primeiro grau, identificando domínio, imagem e taxa de variação',
              'Resolver um problema do cotidiano modelando-o como uma função',
            ],
          },
          {
            code: 'MATH.HIGH_RHETORIC.QUADRATIC_EQUATIONS',
            title: 'Equações do Segundo Grau',
            level: 3,
            ageRecommendation: { min: 15, max: 16 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Resolver uma equação do segundo grau usando a fórmula de Bhaskara, verificando as soluções encontradas',
              'Analisar o número de raízes de uma equação do segundo grau a partir do discriminante',
            ],
          },
          {
            code: 'MATH.HIGH_RHETORIC.PLANE_SPATIAL_GEOMETRY',
            title: 'Geometria Plana e Espacial Avançada',
            level: 3,
            ageRecommendation: { min: 15, max: 17 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Demonstrar, com justificativa passo a passo, uma propriedade geométrica simples (ex.: soma dos ângulos internos de um triângulo)',
              'Calcular o volume e a área de superfície de sólidos geométricos simples (cubo, cilindro, prisma)',
            ],
          },
          {
            code: 'MATH.HIGH_RHETORIC.PROBABILITY',
            title: 'Probabilidade',
            level: 3,
            ageRecommendation: { min: 16, max: 17 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Calcular a probabilidade de um evento simples e de eventos compostos independentes',
              'Explicar a diferença entre probabilidade teórica e frequência observada em um experimento',
            ],
          },
          {
            code: 'MATH.HIGH_RHETORIC.ADVANCED_STATISTICS',
            title: 'Estatística Avançada',
            level: 3,
            ageRecommendation: { min: 16, max: 17 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Calcular medidas de dispersão (amplitude, desvio médio), além de média e mediana, interpretando o que elas revelam sobre um conjunto de dados',
            ],
          },
          {
            code: 'MATH.HIGH_RHETORIC.EXPONENTIALS_LOGARITHMS',
            title: 'Introdução a Exponenciais e Logaritmos',
            level: 3,
            ageRecommendation: { min: 16, max: 17 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Resolver uma equação exponencial simples e explicar a relação entre potenciação e logaritmo',
              'Reconhecer situações do cotidiano modeladas por crescimento exponencial (ex.: juros compostos, crescimento populacional)',
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
