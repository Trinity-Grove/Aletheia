import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 5 seed data: "Formação Bíblica" (Progressão -- nível intermediário) ---
//
// PR #131 built the introductory tier (narrative/historical Bible
// literacy, ages ~6-11). Section 5's "Progressão" subsection calls for
// the next step up: "adolescentes podem entrar em estudo teológico
// propriamente dito" -- something between that introductory tier and the
// genuinely seminary-level "Módulo teológico avançado" described in
// issue #95 section 6 (Bibliologia, Cristologia, Soteriologia,
// Eclesiologia, Escatologia as full systematic-theology disciplines,
// original-language exegesis, academic production like ensaios/
// seminários/defesa oral).
//
// This path is deliberately scoped BELOW that seminary tier:
//  - No original-language exegesis (see biblical-formation-original-
//    languages-literacy.seed-data.ts for the separate, purely-literacy-
//    level Greek/Hebrew awareness competencies).
//  - No denominational position-taking on any contested doctrine
//    (predestination, millennial views, sacramental theology, mode/
//    timing of baptism, church polity, etc.).
//  - No claim that any one tradition's answer is "the" correct one.
//
// Anti-bias framing (same interdenominational principle as PR #131,
// extended one tier deeper per issue #96 section 4/7's requirement that
// the platform "não esconde interpretações concorrentes" and "não
// apresenta determinada tradição denominacional como única posição
// cristã possível"): every competency below is descriptive/historical/
// comparative-survey in nature. Where a competency touches a genuinely
// contested doctrinal question, the objective explicitly asks the
// learner to survey how *different* traditions have historically
// answered it -- never to adopt or be taught one answer as correct.
// Content that virtually all major Christian traditions affirm in
// common (e.g. the historic ecumenical councils' Trinitarian/
// Christological formulations) is treated as shared history, not as
// one tradition's position among others.
//
// TheologicalPositionDefinition (issue #96 Fase 3, sections 7/14) is
// the correct home for any future content that *does* take or label a
// specific denominational position -- explicitly out of scope here, same
// boundary PR #131 already established for the introductory tier.

const DOMAIN_CODE = 'FAITH.BIBLICAL_FORMATION';
const PATH_CODE = 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE';

export interface BiblicalFormationIntermediateDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface BiblicalFormationIntermediatePathSeed {
  code: string;
  name: string;
  description: string;
}

export interface BiblicalFormationIntermediateCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface BiblicalFormationIntermediateSeedData {
  domain: BiblicalFormationIntermediateDomainSeed;
  path: BiblicalFormationIntermediatePathSeed;
  competencies: BiblicalFormationIntermediateCompetencySeed[];
}

export function buildBiblicalFormationIntermediateSeedData(): BiblicalFormationIntermediateSeedData {
  return {
    // Identical to biblical-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // BiblicalFormationSeeder. Whichever runs first creates the domain;
    // the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Formação Bíblica',
      description:
        'Alfabetização bíblica em nível narrativo e histórico -- conhecer as Escrituras como texto e história compartilhada antes de qualquer aprofundamento doutrinário ou denominacional. Interdenominacional por natureza: não representa a posição de nenhuma tradição teológica específica (ver TheologicalPositionDefinition para isso).',
    },
    path: {
      code: PATH_CODE,
      name: 'Progressão Intermediária de Formação Bíblica',
      description:
        'Segundo degrau da progressão descrita na issue #95 seção 5 -- introdução ao estudo teológico propriamente dito para adolescentes, entre a alfabetização bíblica narrativa (Trilha Introdutória) e a formação avançada de nível pré-seminário (issue #95 seção 6, fora de escopo desta trilha). Interdenominacional e comparativo: apresenta questões teológicas e como diferentes tradições cristãs historicamente as responderam, sem advogar por nenhuma posição específica. Não inclui exegese em idiomas originais nem produção acadêmica de nível seminarista.',
    },
    competencies: [
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.THEOLOGICAL_DISCIPLINES_OVERVIEW',
        title: 'Panorama das Disciplinas Teológicas',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Elaborar um glossário descritivo com pelo menos oito disciplinas teológicas (ex.: bibliologia, cristologia, soteriologia, eclesiologia, escatologia), explicando em uma frase o que cada uma estuda -- sem entrar no conteúdo de cada uma',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.HERMENEUTICS_BASICS',
        title: 'Princípios Básicos de Interpretação Bíblica',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Aplicar princípios básicos de hermenêutica (contexto histórico, gênero literário, contexto imediato) na leitura de uma passagem, registrando por escrito como cada princípio muda a leitura',
          'Identificar o gênero literário de pelo menos cinco livros bíblicos diferentes (ex.: narrativa histórica, poesia, profecia, carta, apocalíptico) e explicar por que isso importa para a interpretação',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.CHURCH_HISTORY_OVERVIEW',
        title: 'Panorama da História da Igreja',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Montar uma linha do tempo com os grandes períodos da história da igreja (igreja antiga, concílios ecumênicos, Idade Média, Reforma Protestante, era moderna), com pelo menos um evento marcante por período',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.EARLY_CHURCH_COUNCILS',
        title: 'Concílios da Igreja Antiga',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Descrever o contexto e a formulação central de pelo menos dois concílios ecumênicos antigos (ex.: Niceia, Calcedônia), tratando-os como consenso histórico compartilhado entre as principais tradições cristãs, não como posição de uma única denominação',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.DOCTRINAL_QUESTIONS_SURVEY',
        title: 'Perguntas Teológicas e Respostas Históricas',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Escolher três perguntas teológicas classicamente debatidas (ex.: como a salvação é recebida, o papel dos sacramentos, como a igreja deve ser organizada) e produzir um quadro comparando como diferentes tradições cristãs historicamente as responderam, sem indicar qual resposta é a correta',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.CHRISTIAN_TRADITIONS_OVERVIEW',
        title: 'Panorama das Tradições Cristãs',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Descrever a origem histórica e as características gerais de pelo menos quatro grandes ramos ou famílias de tradições cristãs (ex.: católica, ortodoxa, protestante histórica, protestante evangélica), de forma neutra e sem hierarquizar qual é a tradição correta',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.INDUCTIVE_BIBLE_STUDY',
        title: 'Método de Estudo Bíblico Indutivo',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Conduzir um estudo bíblico indutivo completo (observação, interpretação, aplicação) sobre uma passagem à escolha, registrando cada etapa separadamente em portfólio',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.APOLOGETICS_INTRO',
        title: 'Introdução à Apologética Cristã',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Explicar o que é a apologética como disciplina (defesa racional da fé) e apresentar, de forma respeitosa, como cristãos historicamente responderam a duas objeções comuns à fé cristã',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.INTERMEDIATE.CHRISTIAN_ETHICS_INTRO',
        title: 'Introdução à Ética Cristã',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Descrever duas estruturas clássicas de raciocínio ético cristão (ex.: ética das virtudes, lei natural, ética baseada em princípios bíblicos) e aplicar uma delas à análise de um dilema hipotético simples',
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

export function buildBiblicalFormationIntermediateDomainDto(
  seed: BiblicalFormationIntermediateDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildBiblicalFormationIntermediatePathDto(
  seed: BiblicalFormationIntermediatePathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildBiblicalFormationIntermediateCompetencyDto(
  seed: BiblicalFormationIntermediateCompetencySeed,
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
