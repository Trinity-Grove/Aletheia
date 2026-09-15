import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Core academic subject seed data: "Ciências" ---
//
// Issue #144 Lote 1: second core academic subject after Matemática
// (#142/#145). Same shape and reasoning: real grade/age progression via
// multiple LearningPaths under one LearningDomain, grade-band naming
// aligned with this codebase's existing EducationalStage convention
// (apps/api/prisma/schema.prisma, packages/contracts/src/learner.ts,
// the exact Portuguese labels already shown to families in
// apps/web/src/components/learners/learner-form-modal.tsx):
//   EARLY_YEARS      -> "Educação Infantil (Early Years)"
//   PRIMARY_GRAMMAR  -> "Ensino Fundamental I (Grammar)"
//   MIDDLE_LOGIC     -> "Ensino Fundamental II (Logic)"
//   HIGH_RHETORIC    -> "Ensino Médio (Rhetoric)"
//
// This first slice covers three bands -- EARLY_YEARS (observational
// science, no formal biology/chemistry/physics vocabulary yet),
// PRIMARY_GRAMMAR and MIDDLE_LOGIC (life/earth/physical science basics,
// increasing in depth). HIGH_RHETORIC is deliberately NOT covered here:
// a real Ensino Médio science curriculum needs a physics/chemistry/
// biology split (three separate disciplines, not one generic "Ciências"
// band), which is a meaningfully bigger design decision than extending
// the existing pattern -- left as explicit follow-up rather than forced
// into this slice.
//
// Pre-existing content: curriculum-template.engine.ts has a flat
// "Ciências" Subject stub in the TRADITIONAL framework (description:
// "Biologia, corpo humano, química básica e ecologia", starter
// objectives about body systems/healthy habits and the water cycle/
// states of matter/food chains) and still drives applyTemplate's legacy
// plan for that framework. This domain doesn't touch or duplicate it --
// both coexist, same as every prior content slice. The tone/scope below
// was cross-checked against that stub to stay consistent (the water
// cycle, states of matter, body systems and food chains all reappear
// here as real, separately trackable competencies instead of two
// generic starter objectives).

const DOMAIN_CODE = 'SCIENCE';
const EARLY_YEARS_PATH_CODE = 'SCIENCE.EARLY_YEARS';
const PRIMARY_GRAMMAR_PATH_CODE = 'SCIENCE.PRIMARY_GRAMMAR';
const MIDDLE_LOGIC_PATH_CODE = 'SCIENCE.MIDDLE_LOGIC';

export interface ScienceSubjectDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface ScienceSubjectPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface ScienceSubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface ScienceSubjectPathSeedData {
  path: ScienceSubjectPathSeed;
  competencies: ScienceSubjectCompetencySeed[];
}

export interface ScienceSubjectSeedData {
  domain: ScienceSubjectDomainSeed;
  paths: ScienceSubjectPathSeedData[];
}

export function buildScienceSubjectSeedData(): ScienceSubjectSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Ciências',
      description:
        'Investigação científica, observação da natureza e compreensão do mundo físico e biológico, com progressão real por faixa de idade/série -- cada trilha deste domínio corresponde a um estágio educacional (EducationalStage), começando pela observação sensorial e avançando para conceitos de biologia, física, química e ciências da Terra em nível fundamental. Uma divisão futura por disciplina (física, química, biologia) para o Ensino Médio é trabalho futuro, não coberta nesta fatia.',
    },
    paths: [
      {
        path: {
          code: EARLY_YEARS_PATH_CODE,
          name: 'Ciências -- Educação Infantil (Early Years)',
          description:
            'Ciências para a Educação Infantil (aproximadamente 4 a 5 anos) -- observação sensorial e do ambiente, sem vocabulário formal de biologia, física ou química ainda: os cinco sentidos, seres vivos e não vivos, observação do tempo, causa e efeito simples, plantas e animais ao redor.',
        },
        competencies: [
          {
            code: 'SCIENCE.EARLY_YEARS.FIVE_SENSES',
            title: 'Os Cinco Sentidos',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['observation', 'video'],
            starterObjectives: [
              'Identificar e nomear os cinco sentidos (visão, audição, olfato, paladar, tato), associando cada um a um órgão do corpo',
              'Explorar um objeto usando pelo menos dois sentidos diferentes e descrever o que percebeu',
            ],
          },
          {
            code: 'SCIENCE.EARLY_YEARS.LIVING_NONLIVING',
            title: 'Seres Vivos e Não Vivos',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['observation', 'photo'],
            starterObjectives: [
              'Classificar objetos e seres do cotidiano em vivos e não vivos, explicando o critério usado',
            ],
          },
          {
            code: 'SCIENCE.EARLY_YEARS.WEATHER_OBSERVATION',
            title: 'Observação do Tempo (Clima)',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Observar e descrever o tempo (ensolarado, chuvoso, nublado, ventoso) por pelo menos uma semana, registrando com desenhos',
            ],
          },
          {
            code: 'SCIENCE.EARLY_YEARS.SIMPLE_CAUSE_EFFECT',
            title: 'Causa e Efeito Simples',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Prever e observar o resultado de uma ação simples (ex.: soltar um objeto, combinar duas cores diferentes), explicando o que aconteceu',
            ],
          },
          {
            code: 'SCIENCE.EARLY_YEARS.PLANTS_ANIMALS_AROUND',
            title: 'Plantas e Animais ao Redor',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Observar e nomear pelo menos três plantas e três animais do ambiente próximo (casa, quintal, parque)',
            ],
          },
        ],
      },
      {
        path: {
          code: PRIMARY_GRAMMAR_PATH_CODE,
          name: 'Ciências -- Ensino Fundamental I (Grammar)',
          description:
            'Ciências para o Ensino Fundamental I (aproximadamente 6 a 10 anos) -- corpo humano e hábitos saudáveis, ciclos de vida, ciclo da água, estados físicos da matéria, máquinas simples, ímãs, luz e sombra.',
        },
        competencies: [
          {
            code: 'SCIENCE.PRIMARY_GRAMMAR.HUMAN_BODY',
            title: 'Corpo Humano e Hábitos Saudáveis',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Descrever as funções básicas de pelo menos três sistemas do corpo humano (ex.: digestivo, respiratório, circulatório)',
              'Explicar pelo menos três hábitos saudáveis e por que são importantes',
            ],
          },
          {
            code: 'SCIENCE.PRIMARY_GRAMMAR.PLANT_ANIMAL_LIFE_CYCLES',
            title: 'Ciclos de Vida de Plantas e Animais',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Descrever o ciclo de vida de uma planta e de um animal, identificando as principais fases',
            ],
          },
          {
            code: 'SCIENCE.PRIMARY_GRAMMAR.WATER_CYCLE',
            title: 'Ciclo da Água',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Explicar e representar (com desenho) as etapas do ciclo da água: evaporação, condensação e precipitação',
            ],
          },
          {
            code: 'SCIENCE.PRIMARY_GRAMMAR.STATES_OF_MATTER',
            title: 'Estados Físicos da Matéria',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Identificar exemplos de sólido, líquido e gasoso no cotidiano, e demonstrar uma mudança de estado (ex.: gelo derretendo)',
            ],
          },
          {
            code: 'SCIENCE.PRIMARY_GRAMMAR.SIMPLE_MACHINES',
            title: 'Máquinas Simples',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['photo', 'video'],
            starterObjectives: [
              'Identificar e explicar o funcionamento de pelo menos duas máquinas simples do cotidiano (ex.: alavanca, roldana, plano inclinado)',
            ],
          },
          {
            code: 'SCIENCE.PRIMARY_GRAMMAR.MAGNETS_LIGHT',
            title: 'Ímãs, Luz e Sombra',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Demonstrar experimentalmente como um ímã atrai ou repele objetos',
              'Explicar como se forma uma sombra e como o tamanho dela pode mudar',
            ],
          },
        ],
      },
      {
        path: {
          code: MIDDLE_LOGIC_PATH_CODE,
          name: 'Ciências -- Ensino Fundamental II (Logic)',
          description:
            'Ciências para o Ensino Fundamental II (aproximadamente 11 a 14 anos) -- ecossistemas e cadeias alimentares, introdução às células, matéria e energia, estrutura da Terra, sistema solar e introdução à química básica.',
        },
        competencies: [
          {
            code: 'SCIENCE.MIDDLE_LOGIC.ECOSYSTEMS_FOOD_CHAINS',
            title: 'Ecossistemas e Cadeias Alimentares',
            level: 2,
            ageRecommendation: { min: 10, max: 12 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Construir uma cadeia alimentar simples identificando produtores, consumidores e decompositores',
              'Explicar como um desequilíbrio em um ecossistema afeta uma cadeia alimentar',
            ],
          },
          {
            code: 'SCIENCE.MIDDLE_LOGIC.CELLS_INTRO',
            title: 'Introdução às Células',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar que os seres vivos são formados por células e descrever, em termos simples, a diferença entre célula animal e vegetal',
            ],
          },
          {
            code: 'SCIENCE.MIDDLE_LOGIC.MATTER_AND_ENERGY',
            title: 'Matéria e Energia',
            level: 2,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar a diferença entre mudanças físicas e químicas, dando um exemplo de cada',
              'Identificar diferentes formas de energia (térmica, luminosa, elétrica, mecânica) em situações do cotidiano',
            ],
          },
          {
            code: 'SCIENCE.MIDDLE_LOGIC.EARTH_STRUCTURE',
            title: 'Estrutura da Terra e Placas Tectônicas',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Descrever as camadas da Terra e explicar, em termos simples, o que são placas tectônicas',
            ],
          },
          {
            code: 'SCIENCE.MIDDLE_LOGIC.SOLAR_SYSTEM',
            title: 'Sistema Solar',
            level: 2,
            ageRecommendation: { min: 10, max: 13 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Descrever a posição e as principais características dos planetas do sistema solar',
              'Explicar por que ocorrem o dia e a noite e as estações do ano',
            ],
          },
          {
            code: 'SCIENCE.MIDDLE_LOGIC.BASIC_CHEMISTRY',
            title: 'Introdução à Química Básica',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text', 'video'],
            starterObjectives: [
              'Diferenciar substância pura de mistura, dando exemplos do cotidiano',
              'Realizar um experimento simples de separação de misturas (ex.: filtração, decantação) com supervisão',
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

export function buildScienceSubjectDomainDto(seed: ScienceSubjectDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildScienceSubjectPathDto(
  seed: ScienceSubjectPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildScienceSubjectCompetencyDto(
  seed: ScienceSubjectCompetencySeed,
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
