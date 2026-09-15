import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 17 seed data: "Vocação" ---
//
// Same pattern as biblical-formation.seed-data.ts (section 5, PR #131),
// trades-formation.seed-data.ts (section 15, PR #134),
// cooking-formation.seed-data.ts (section 18, PR #135),
// gardening-formation.seed-data.ts (section 19, PR #136), and
// technology-formation.seed-data.ts (section 16, PR #167): a new, richer
// Domain -> Path -> Competency slice. No pre-existing Subject stub
// mentions vocação/carreira/empreendedorismo, so this domain has no
// coexistence concern the way ARTS_TRADES_VOCATION_SUBJECTS /
// FAITH_AND_THEOLOGY_SUBJECTS created for the first content slices.
//
// Section 17 lists exactly 13 items, with no explicit subsection
// grouping. Splits naturally into two foundational LearningPaths under a
// single new `VOCATION` LearningDomain, using the same
// multi-path-in-one-seeder shape as technology-formation.seed-data.ts:
//
//   - VOCATION.EXPLORATION ("Autoconhecimento e Exploração Vocacional"):
//     the self-discovery/exposure half -- Mapeamento de Interesses,
//     Mapeamento de Habilidades, Talentos, Mentoria, Contato com
//     Profissionais, Job Shadowing (6 competencies).
//   - VOCATION.PRACTICE_AND_PURPOSE ("Prática Vocacional e Propósito"):
//     the doing/reflecting half -- Projetos Vocacionais, Projetos Reais,
//     Empreendedorismo, Serviço Comunitário, Portfólio Profissional,
//     Reflexão sobre Vocação Cristã, Trabalho Entendido como Serviço e
//     Responsabilidade (7 competencies).
//
// Every one of section 17's 13 items maps to exactly one competency
// below (1:1) -- nothing added, nothing dropped.
//
// Neutrality constraint (task instruction, same principle as PR #131's
// biblical-formation and PR #158's music-christian): "Reflexão sobre
// Vocação Cristã" and "Trabalho Entendido como Serviço e Responsabilidade"
// stay interdenominational and historical/descriptive -- they ask the
// learner to research, compare, and articulate how the concept of
// vocação/chamado has been understood across Christian history and
// traditions, never to adopt or be taught one denomination's doctrinal
// position as the single correct one. Verified by a dedicated
// neutrality-scan integration test (no denominational or
// doctrinal-position terms in the seeded rows).
const DOMAIN_CODE = 'VOCATION';

export interface VocationFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface VocationFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface VocationFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface VocationFormationPathSeedData {
  path: VocationFormationPathSeed;
  competencies: VocationFormationCompetencySeed[];
}

export interface VocationFormationSeedData {
  domain: VocationFormationDomainSeed;
  paths: VocationFormationPathSeedData[];
}

export function buildVocationFormationSeedData(): VocationFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Vocação',
      description:
        'Formação vocacional como disciplina própria -- autoconhecimento de interesses, habilidades e talentos, exposição real ao mundo do trabalho e prática vocacional através de projetos, serviço comunitário e reflexão sobre propósito, começando pelos fundamentos de cada área (issue #95 seção 17).',
    },
    paths: [
      {
        path: {
          code: 'VOCATION.EXPLORATION',
          name: 'Autoconhecimento e Exploração Vocacional',
          description:
            'Trilha fundamental de autoconhecimento e exploração vocacional -- mapeamento de interesses, mapeamento de habilidades, talentos, mentoria, contato com profissionais e job shadowing (issue #95 seção 17).',
        },
        competencies: [
          {
            code: 'VOCATION.EXPLORATION.INTEREST_MAPPING',
            title: 'Mapeamento de Interesses',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Listar e classificar pelo menos dez atividades, temas ou áreas de interesse pessoal, explicando o que especificamente atrai em cada um',
              'Identificar padrões entre os próprios interesses listados e relacioná-los a pelo menos três áreas de estudo ou profissões possíveis',
            ],
          },
          {
            code: 'VOCATION.EXPLORATION.SKILLS_MAPPING',
            title: 'Mapeamento de Habilidades',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Listar pelo menos oito habilidades pessoais (técnicas, práticas ou interpessoais), com um exemplo concreto de quando cada uma foi demonstrada',
            ],
          },
          {
            code: 'VOCATION.EXPLORATION.TALENTS',
            title: 'Talentos',
            level: 1,
            ageRecommendation: { min: 10, max: 17 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Identificar, com apoio de familiares, professores ou mentores, pelo menos três talentos naturais reconhecidos por outras pessoas, e descrever como cada um já apareceu em situações reais',
            ],
          },
          {
            code: 'VOCATION.EXPLORATION.MENTORSHIP',
            title: 'Mentoria',
            level: 1,
            ageRecommendation: { min: 12, max: 18 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Estabelecer uma conversa estruturada com um mentor (alguém com mais experiência em uma área de interesse) e registrar pelo menos três aprendizados concretos obtidos',
            ],
          },
          {
            code: 'VOCATION.EXPLORATION.PROFESSIONAL_CONTACT',
            title: 'Contato com Profissionais',
            level: 1,
            ageRecommendation: { min: 11, max: 18 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Entrevistar pelo menos um profissional de uma área de interesse sobre sua rotina de trabalho, formação e desafios, registrando as perguntas e as respostas',
            ],
          },
          {
            code: 'VOCATION.EXPLORATION.JOB_SHADOWING',
            title: 'Job Shadowing',
            level: 1,
            ageRecommendation: { min: 13, max: 18 },
            evidenceTypes: ['text', 'observation', 'photo'],
            starterObjectives: [
              'Acompanhar, por um período combinado, o dia de trabalho de um profissional em uma área de interesse, registrando as atividades observadas e o que aprendeu sobre a profissão',
            ],
          },
        ],
      },
      {
        path: {
          code: 'VOCATION.PRACTICE_AND_PURPOSE',
          name: 'Prática Vocacional e Propósito',
          description:
            'Trilha fundamental de prática vocacional e propósito -- projetos vocacionais, projetos reais, empreendedorismo, serviço comunitário, portfólio profissional, reflexão sobre vocação cristã e trabalho entendido como serviço e responsabilidade (issue #95 seção 17).',
        },
        competencies: [
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.VOCATIONAL_PROJECTS',
            title: 'Projetos Vocacionais',
            level: 1,
            ageRecommendation: { min: 11, max: 18 },
            evidenceTypes: ['text', 'photo', 'observation'],
            starterObjectives: [
              'Planejar e executar um pequeno projeto ligado a uma área vocacional de interesse, do planejamento inicial até um resultado concreto, registrando as etapas percorridas',
            ],
          },
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.REAL_PROJECTS',
            title: 'Projetos Reais',
            level: 1,
            ageRecommendation: { min: 12, max: 18 },
            evidenceTypes: ['text', 'photo', 'observation'],
            starterObjectives: [
              'Participar de um projeto real com um resultado que beneficia outra pessoa ou grupo (não apenas um exercício escolar), descrevendo o problema resolvido e o próprio papel no projeto',
            ],
          },
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.ENTREPRENEURSHIP',
            title: 'Empreendedorismo',
            level: 1,
            ageRecommendation: { min: 12, max: 18 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Planejar e executar uma pequena iniciativa empreendedora (ex.: venda de um produto ou serviço simples), descrevendo a ideia, o público, o custo e o resultado obtido',
            ],
          },
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.COMMUNITY_SERVICE',
            title: 'Serviço Comunitário',
            level: 1,
            ageRecommendation: { min: 9, max: 18 },
            evidenceTypes: ['text', 'photo', 'observation'],
            starterObjectives: [
              'Participar de uma atividade de serviço comunitário voluntário, descrevendo a necessidade atendida, o que foi feito e o que aprendeu com a experiência',
            ],
          },
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.PROFESSIONAL_PORTFOLIO',
            title: 'Portfólio Profissional',
            level: 1,
            ageRecommendation: { min: 13, max: 18 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Organizar um portfólio simples reunindo pelo menos três produções, projetos ou experiências relevantes para uma área vocacional de interesse, com uma breve descrição de cada item',
            ],
          },
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.CHRISTIAN_VOCATION_REFLECTION',
            title: 'Reflexão sobre Vocação Cristã',
            level: 1,
            ageRecommendation: { min: 13, max: 18 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Pesquisar e descrever, de forma comparativa, como diferentes tradições cristãs históricas entenderam a ideia de vocação (chamado) ao longo do tempo, sem adotar nenhuma interpretação específica como a única correta',
              'Escrever uma reflexão pessoal relacionando os próprios interesses e talentos à ideia de vocação como chamado, situando-a no contexto histórico e comparativo pesquisado',
            ],
          },
          {
            code: 'VOCATION.PRACTICE_AND_PURPOSE.WORK_AS_SERVICE',
            title: 'Trabalho Entendido como Serviço e Responsabilidade',
            level: 1,
            ageRecommendation: { min: 11, max: 18 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Descrever, com exemplos concretos da própria experiência (tarefas domésticas, projetos escolares, serviço comunitário), como o trabalho bem-feito beneficia outras pessoas e não apenas quem o realiza',
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

export function buildVocationFormationDomainDto(seed: VocationFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildVocationFormationPathDto(
  seed: VocationFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildVocationFormationCompetencyDto(
  seed: VocationFormationCompetencySeed,
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
