import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 23 seed data: "Formação física" ---
//
// Same pattern as gardening-formation.seed-data.ts (issue #95 section 19,
// PR #136), resilience-formation.seed-data.ts (issue #95 section 20), and
// the rest of the Domain -> Path -> Competency slices: a new, richer
// Domain -> Path -> Competency slice, not a migration of pre-existing
// hardcoded content.
//
// No pre-existing full LearningDomain covers physical formation.
// curriculum-template.engine.ts's MONTESSORI "Vida Prática" Subject stub
// mentions "coordenação motora" in passing (one clause of a broader
// practical-life description), but that stub is about independence in
// self-care/home-care tasks, not physical education as its own
// discipline -- no real coexistence conflict, same situation Musicalização
// had with the pre-existing "Musicalização e Artes" stub (PR #132).
//
// Section 23 lists eight items: educação física, coordenação motora,
// condicionamento físico, esportes, artes marciais, atividades outdoor,
// progressão por habilidade, registro de treino. Seven of them are
// genuinely content-shaped and become one competency each below.
// "Registro de treino" is deliberately NOT a competency here: it's a
// tracking/UX concern (a workout/training log), already served by the
// existing EvidenceSubmission infrastructure (any competency below can
// already receive text/photo/video/observation evidence over time --
// that *is* a training record). Same judgment call as the "Progressão"
// mechanism-items in Musicalização's foundational slice (PR #132's
// report) and the registro/portfólio items excluded from the sibling
// "Serviço e comunidade" slice (issue #95 section 24): resolved by
// reuse, not built as new catalog content.
//
// "Progressão por habilidade" is different from "registro de treino": it
// is kept as a real competency (goal-setting and comparing performance
// over time for a chosen physical skill), matching the precedent set by
// ResilienceFormationSeeder's "Progressão por Idade" competency (issue
// #95 section 20) rather than being treated as pure mechanism.
//
// Neutrality/scope boundaries deliberately built into every objective:
//   - No single sport or martial-arts style is named or favored --
//     objectives say "uma modalidade esportiva/de luta à escolha" so the
//     content works for any family's choice.
//   - "Atividades outdoor" here means physical conditioning through
//     outdoor movement (trilha, caminhada, ciclismo, natação) -- it does
//     NOT overlap with RESILIENCE's navigation/camping/survival content
//     (compass use, shelter building, route planning, emergency
//     response), which lives in a separate domain
//     (resilience-navigation-camping.seed-data.ts,
//     resilience-water-fire.seed-data.ts,
//     resilience-real-emergencies.seed-data.ts). An integration test
//     scans this slice for RESILIENCE-specific terms and asserts none
//     leaked in.

const DOMAIN_CODE = 'PHYSICAL';
const PATH_CODE = 'PHYSICAL.FOUNDATIONS';

export interface PhysicalFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface PhysicalFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface PhysicalFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface PhysicalFormationSeedData {
  domain: PhysicalFormationDomainSeed;
  path: PhysicalFormationPathSeed;
  competencies: PhysicalFormationCompetencySeed[];
}

export function buildPhysicalFormationSeedData(): PhysicalFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Formação Física',
      description:
        'Formação física como disciplina própria e trackable -- educação física, coordenação motora, condicionamento, esportes, artes marciais e atividades outdoor, com progressão de habilidade registrável, sem favorecer nenhuma modalidade, esporte ou estilo de luta específico.',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Formação Física',
      description:
        'Trilha fundamental de formação física -- educação física, coordenação motora, condicionamento físico, esportes, artes marciais, atividades outdoor e progressão por habilidade (issue #95 seção 23).',
    },
    competencies: [
      {
        code: 'PHYSICAL.FOUNDATIONS.PHYSICAL_EDUCATION',
        title: 'Educação Física',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Executar uma sequência de aquecimento e alongamento básico antes de uma atividade física, explicando a função de cada etapa',
          'Demonstrar domínio de pelo menos três movimentos fundamentais (correr, saltar, arremessar, equilibrar) em um circuito simples',
        ],
      },
      {
        code: 'PHYSICAL.FOUNDATIONS.MOTOR_COORDINATION',
        title: 'Coordenação Motora',
        level: 1,
        ageRecommendation: { min: 5, max: 10 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Realizar um circuito de coordenação motora (ex.: pular corda, driblar, equilibrar-se em uma linha) registrando em vídeo a execução',
          'Demonstrar coordenação entre visão e movimento em uma atividade de lançar e receber um objeto',
        ],
      },
      {
        code: 'PHYSICAL.FOUNDATIONS.CONDITIONING',
        title: 'Condicionamento Físico',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Cumprir e registrar um plano simples de condicionamento físico (ex.: caminhada, corrida leve, exercícios funcionais) ao longo de pelo menos duas semanas, anotando duração e percepção de esforço',
          'Explicar com as próprias palavras a diferença entre resistência, força e flexibilidade, citando um exercício para cada',
        ],
      },
      {
        code: 'PHYSICAL.FOUNDATIONS.SPORTS',
        title: 'Esportes',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['video', 'photo', 'observation'],
        starterObjectives: [
          'Participar de uma modalidade esportiva à escolha, demonstrando compreensão das regras básicas e do papel do fair play',
          'Descrever, após uma partida ou treino, um ponto forte e um ponto a melhorar no próprio desempenho',
        ],
      },
      {
        code: 'PHYSICAL.FOUNDATIONS.MARTIAL_ARTS',
        title: 'Artes Marciais',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar postura básica, disciplina e uma sequência simples de movimentos de uma modalidade de arte marcial ou luta à escolha, sob supervisão de um responsável ou instrutor',
          'Explicar com as próprias palavras os princípios de autocontrole e respeito ao adversário praticados na modalidade escolhida',
        ],
      },
      {
        code: 'PHYSICAL.FOUNDATIONS.OUTDOOR_ACTIVITIES',
        title: 'Atividades Outdoor',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Participar de uma atividade física ao ar livre (trilha, caminhada, ciclismo ou natação) registrando em fotos o percurso ou a atividade realizada',
          'Explicar cuidados básicos de segurança e hidratação antes de uma atividade física ao ar livre',
        ],
      },
      {
        code: 'PHYSICAL.FOUNDATIONS.SKILL_PROGRESSION',
        title: 'Progressão por Habilidade',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Definir uma meta de progressão para uma habilidade física específica (ex.: número de repetições, tempo de corrida, faixa em uma arte marcial) e registrar o avanço ao longo de um período determinado',
          'Comparar o próprio desempenho em uma habilidade física entre dois momentos distintos, identificando o que mudou',
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

export function buildPhysicalFormationDomainDto(seed: PhysicalFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildPhysicalFormationPathDto(
  seed: PhysicalFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildPhysicalFormationCompetencyDto(
  seed: PhysicalFormationCompetencySeed,
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
