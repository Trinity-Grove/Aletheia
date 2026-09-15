import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 16 seed data: "Tecnologia como ofício moderno" ---
//
// Same pattern as biblical-formation.seed-data.ts (issue #95 section 5,
// PR #131), music-formation.seed-data.ts (section 13, PR #132),
// trades-formation.seed-data.ts (section 15, PR #134),
// cooking-formation.seed-data.ts (section 18, PR #135), and
// gardening-formation.seed-data.ts (section 19, PR #136): a new, richer
// Domain -> Path -> Competency slice, not a migration of pre-existing
// hardcoded content. No pre-existing Subject stub mentions
// programação/eletrônica/tecnologia, so this domain has no coexistence
// concern the way ARTS_TRADES_VOCATION_SUBJECTS / FAITH_AND_THEOLOGY_SUBJECTS
// created for the first four slices.
//
// Section 16 lists exactly 13 items, with no explicit subsection
// grouping. Following the task's own framing ("Tecnologia might split
// into 'fundamentos de programação/eletrônica' and 'fabricação
// digital'"), this domain ships as ONE PR with TWO foundational
// LearningPaths under a single new `TECHNOLOGY` LearningDomain, using
// the same multi-path-in-one-seeder shape established by
// trades-mechanical-electrical-home.seed-data.ts (PR #165):
//
//   - TECHNOLOGY.PROGRAMMING_SYSTEMS ("Programação e Sistemas"): the
//     software/logic/embedded-systems half -- Programação, Criação de
//     Software, Robótica, Arduino/ESP32, Automação, IoT, Redes (7
//     competencies).
//   - TECHNOLOGY.ELECTRONICS_FABRICATION ("Eletrônica e Fabricação
//     Digital"): the hardware/physical-making half -- Eletrônica,
//     Montagem de Computadores, CAD, Impressão 3D, Fabricação Digital,
//     Produção Audiovisual (6 competencies).
//
// Every one of section 16's 13 items maps to exactly one competency
// below (1:1, matching the granularity already used for Plantio's nine
// Fundamentos items) -- nothing added, nothing dropped.
//
// Every objective is written at an introductory, single-concept level
// (one language/tool/board/technique at a time) so this stays a genuine
// "fundamentals" slice a family can build future specialization tracks
// on top of, rather than assuming any prior technology exposure.
const DOMAIN_CODE = 'TECHNOLOGY';

export interface TechnologyFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface TechnologyFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface TechnologyFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TechnologyFormationPathSeedData {
  path: TechnologyFormationPathSeed;
  competencies: TechnologyFormationCompetencySeed[];
}

export interface TechnologyFormationSeedData {
  domain: TechnologyFormationDomainSeed;
  paths: TechnologyFormationPathSeedData[];
}

export function buildTechnologyFormationSeedData(): TechnologyFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Tecnologia',
      description:
        'Formação em tecnologia como ofício moderno -- programação, eletrônica, robótica, automação e fabricação digital como disciplina própria, começando pelos fundamentos de cada área antes de qualquer especialização avançada (issue #95 seção 16).',
    },
    paths: [
      {
        path: {
          code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS',
          name: 'Programação e Sistemas',
          description:
            'Trilha fundamental de programação e sistemas -- lógica de programação, criação de software, robótica, microcontroladores (Arduino/ESP32), automação, internet das coisas e redes (issue #95 seção 16).',
        },
        competencies: [
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.PROGRAMMING_BASICS',
            title: 'Programação',
            level: 1,
            ageRecommendation: { min: 9, max: 16 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Escrever e executar um programa simples com variáveis, condicionais e um laço de repetição, explicando o que cada parte faz',
              'Encontrar e corrigir um erro simples (bug) em um programa curto, explicando qual era a causa',
            ],
          },
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.SOFTWARE_PROJECT',
            title: 'Criação de Software',
            level: 1,
            ageRecommendation: { min: 11, max: 17 },
            evidenceTypes: ['text', 'photo', 'observation'],
            starterObjectives: [
              'Planejar e construir um pequeno programa ou aplicativo funcional do início ao fim (ex.: uma calculadora simples, um jogo básico, uma lista de tarefas), descrevendo os passos do planejamento até o resultado final',
            ],
          },
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.ROBOTICS',
            title: 'Robótica',
            level: 1,
            ageRecommendation: { min: 9, max: 16 },
            evidenceTypes: ['video', 'photo', 'observation'],
            starterObjectives: [
              'Montar um robô simples (com kit de robótica ou peças reaproveitadas) e programá-lo para realizar uma tarefa básica (ex.: seguir uma linha, desviar de um obstáculo), registrando o processo em vídeo',
            ],
          },
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.MICROCONTROLLERS',
            title: 'Arduino/ESP32',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['video', 'text', 'observation'],
            starterObjectives: [
              'Montar um circuito simples com um microcontrolador (Arduino, ESP32 ou equivalente), um sensor e um atuador (ex.: LED, buzzer), escrevendo e explicando o código que faz o atuador responder ao sensor',
            ],
          },
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.AUTOMATION',
            title: 'Automação',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['text', 'video'],
            starterObjectives: [
              'Criar uma automação simples que executa uma ação repetitiva sem intervenção manual (ex.: uma rotina que liga uma luz em horário programado, um script que organiza arquivos), explicando o gatilho e a ação',
            ],
          },
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.IOT',
            title: 'Internet das Coisas (IoT)',
            level: 1,
            ageRecommendation: { min: 11, max: 17 },
            evidenceTypes: ['text', 'video', 'observation'],
            starterObjectives: [
              'Conectar um dispositivo simples (sensor ou microcontrolador) à internet ou a uma rede local e demonstrar o envio de um dado (ex.: temperatura, estado de um botão) para um painel, aplicativo ou log, explicando o caminho que o dado percorre',
            ],
          },
          {
            code: 'TECHNOLOGY.PROGRAMMING_SYSTEMS.NETWORKS',
            title: 'Redes',
            level: 1,
            ageRecommendation: { min: 9, max: 16 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Explicar com as próprias palavras como dois dispositivos se comunicam em uma rede doméstica (roteador, IP local, Wi-Fi/cabo) e identificar os dispositivos conectados a uma rede real',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TECHNOLOGY.ELECTRONICS_FABRICATION',
          name: 'Eletrônica e Fabricação Digital',
          description:
            'Trilha fundamental de eletrônica e fabricação digital -- eletrônica básica, montagem de computadores, CAD, impressão 3D, fabricação digital e produção audiovisual (issue #95 seção 16).',
        },
        competencies: [
          {
            code: 'TECHNOLOGY.ELECTRONICS_FABRICATION.ELECTRONICS_BASICS',
            title: 'Eletrônica',
            level: 1,
            ageRecommendation: { min: 9, max: 16 },
            evidenceTypes: ['photo', 'text', 'observation'],
            starterObjectives: [
              'Montar um circuito eletrônico simples em protoboard (ex.: LED com resistor, botão, sensor básico) e explicar a função de cada componente usado',
            ],
          },
          {
            code: 'TECHNOLOGY.ELECTRONICS_FABRICATION.COMPUTER_ASSEMBLY',
            title: 'Montagem de Computadores',
            level: 1,
            ageRecommendation: { min: 11, max: 17 },
            evidenceTypes: ['video', 'photo', 'observation'],
            starterObjectives: [
              'Identificar os principais componentes internos de um computador (placa-mãe, processador, memória, armazenamento, fonte) e, com supervisão de um adulto responsável, montar ou desmontar um computador explicando a função de cada peça',
            ],
          },
          {
            code: 'TECHNOLOGY.ELECTRONICS_FABRICATION.CAD',
            title: 'CAD',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Modelar um objeto simples em um programa de CAD (desenho assistido por computador), definindo medidas reais, e exportar o modelo em um formato de arquivo padrão',
            ],
          },
          {
            code: 'TECHNOLOGY.ELECTRONICS_FABRICATION.PRINTING_3D',
            title: 'Impressão 3D',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['photo', 'video', 'observation'],
            starterObjectives: [
              'Preparar um modelo 3D para impressão (fatiamento) e, com supervisão de um adulto responsável, imprimir um objeto simples, registrando em fotos o resultado e explicando pelo menos um ajuste feito no processo',
            ],
          },
          {
            code: 'TECHNOLOGY.ELECTRONICS_FABRICATION.DIGITAL_FABRICATION',
            title: 'Fabricação Digital',
            level: 1,
            ageRecommendation: { min: 11, max: 17 },
            evidenceTypes: ['photo', 'text', 'observation'],
            starterObjectives: [
              'Planejar e produzir um objeto simples usando uma técnica de fabricação digital além da impressão 3D (ex.: corte a laser, corte vinil, corte CNC), do desenho digital até a peça final, explicando as etapas do processo',
            ],
          },
          {
            code: 'TECHNOLOGY.ELECTRONICS_FABRICATION.AV_PRODUCTION',
            title: 'Produção Audiovisual',
            level: 1,
            ageRecommendation: { min: 9, max: 17 },
            evidenceTypes: ['video', 'text'],
            starterObjectives: [
              'Planejar, gravar e editar um vídeo curto (roteiro simples, captação e edição básica com cortes e áudio), explicando as decisões tomadas em cada etapa',
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

export function buildTechnologyFormationDomainDto(seed: TechnologyFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildTechnologyFormationPathDto(
  seed: TechnologyFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildTechnologyFormationCompetencyDto(
  seed: TechnologyFormationCompetencySeed,
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
