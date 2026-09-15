import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 24 seed data: "Serviço e comunidade" ---
//
// Same pattern as physical-formation.seed-data.ts (issue #95 section 23)
// and the rest of the Domain -> Path -> Competency slices: a new, richer
// Domain -> Path -> Competency slice, not a migration of pre-existing
// hardcoded content. No pre-existing LearningDomain covers community
// service.
//
// Section 24 lists eight items: serviço comunitário, projetos de
// voluntariado, igreja, comunidade, projetos intergeracionais, registro
// de atividades, reflexão pós-atividade, portfólio de serviço. Six of
// them are genuinely content-shaped and become one competency each
// below. "Registro de atividades" and "Portfólio de serviço" are
// deliberately NOT competencies here: both are tracking/UX concerns
// already served by the existing EvidenceSubmission infrastructure
// (every competency below can already receive text/photo/video/
// observation evidence, and the platform's existing portfolio feature
// already aggregates that evidence over time) -- the same reuse-not-
// build judgment applied to "registro de treino" in the sibling
// "Formação física" slice (issue #95 section 23, PhysicalFormationSeeder)
// and to the "Progressão" mechanism-items in Musicalização's foundational
// slice (PR #132's report). "Reflexão pós-atividade" is different: it's
// kept as a real competency (the skill of producing a structured
// reflection after a service experience), not pure record-keeping.
//
// Interdenominational neutrality (issue #96's principle, and issue #95
// section 4's "a plataforma evita apresentar determinada tradição
// denominacional como única posição cristã possível", same reasoning
// already established for biblical-formation.seed-data.ts, PR #131): the
// "Igreja" item becomes a competency about serving one's own faith
// community in general -- acolhimento, organização, apoio a um grupo --
// without naming or assuming any specific denomination, worship
// practice, or doctrinal position. An integration test scans this slice
// for denominational-position terms and asserts none leaked in.

const DOMAIN_CODE = 'SERVICE';
const PATH_CODE = 'SERVICE.FOUNDATIONS';

export interface ServiceCommunityFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface ServiceCommunityFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface ServiceCommunityFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface ServiceCommunityFormationSeedData {
  domain: ServiceCommunityFormationDomainSeed;
  path: ServiceCommunityFormationPathSeed;
  competencies: ServiceCommunityFormationCompetencySeed[];
}

export function buildServiceCommunityFormationSeedData(): ServiceCommunityFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Serviço e Comunidade',
      description:
        'Formação em serviço e engajamento comunitário como disciplina própria e trackable -- serviço comunitário, voluntariado, serviço na comunidade de fé, engajamento com a comunidade local, projetos intergeracionais e reflexão sobre a própria experiência de servir, interdenominacional por natureza (sem assumir tradição, denominação ou prática de fé específica).',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Serviço e Comunidade',
      description:
        'Trilha fundamental de serviço e comunidade -- serviço comunitário, voluntariado, igreja, comunidade, projetos intergeracionais e reflexão pós-atividade (issue #95 seção 24).',
    },
    competencies: [
      {
        code: 'SERVICE.FOUNDATIONS.COMMUNITY_SERVICE',
        title: 'Serviço Comunitário',
        level: 1,
        ageRecommendation: { min: 8, max: 16 },
        evidenceTypes: ['photo', 'text', 'observation'],
        starterObjectives: [
          'Participar de um projeto de serviço comunitário, registrando o papel desempenhado e o impacto observado',
          'Identificar uma necessidade real na própria comunidade local e propor uma ação simples para atendê-la',
        ],
      },
      {
        code: 'SERVICE.FOUNDATIONS.VOLUNTEERING',
        title: 'Projetos de Voluntariado',
        level: 1,
        ageRecommendation: { min: 8, max: 16 },
        evidenceTypes: ['photo', 'text', 'observation'],
        starterObjectives: [
          'Participar de uma atividade de voluntariado organizada (instituição, ONG ou grupo comunitário), descrevendo a organização, a atividade realizada e o público atendido',
          'Comparar duas formas diferentes de voluntariado (ex.: doação de tempo e doação de recursos), explicando as diferenças com as próprias palavras',
        ],
      },
      {
        code: 'SERVICE.FOUNDATIONS.FAITH_COMMUNITY_SERVICE',
        title: 'Serviço na Comunidade de Fé',
        level: 1,
        ageRecommendation: { min: 8, max: 16 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Participar de uma atividade de serviço dentro da própria comunidade de fé (ex.: acolhimento, organização, apoio a um grupo), registrando a função desempenhada',
          'Explicar com as próprias palavras o papel do serviço voluntário na vida de uma comunidade de fé',
        ],
      },
      {
        code: 'SERVICE.FOUNDATIONS.LOCAL_COMMUNITY',
        title: 'Comunidade',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['text', 'photo', 'observation'],
        starterObjectives: [
          'Mapear pelo menos três instituições ou grupos da própria comunidade local (ex.: escola, posto de saúde, associação de bairro) e descrever o papel de cada um',
          'Participar de uma atividade coletiva da comunidade local (mutirão, evento de bairro, reunião de associação), descrevendo sua própria contribuição',
        ],
      },
      {
        code: 'SERVICE.FOUNDATIONS.INTERGENERATIONAL_PROJECTS',
        title: 'Projetos Intergeracionais',
        level: 1,
        ageRecommendation: { min: 8, max: 16 },
        evidenceTypes: ['photo', 'video', 'text'],
        starterObjectives: [
          'Realizar uma atividade planejada com uma pessoa de outra geração (avós, idosos da comunidade, crianças menores), registrando o que foi aprendido de cada lado',
          'Entrevistar uma pessoa mais velha sobre uma experiência de vida relevante, registrando por escrito ou em áudio/vídeo os principais aprendizados',
        ],
      },
      {
        code: 'SERVICE.FOUNDATIONS.POST_ACTIVITY_REFLECTION',
        title: 'Reflexão Pós-Atividade',
        level: 1,
        ageRecommendation: { min: 8, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Produzir uma reflexão escrita após uma atividade de serviço ou voluntariado, descrevendo o que foi feito, o que foi aprendido e o que faria diferente',
          'Relacionar uma experiência de serviço a uma competência pessoal desenvolvida (ex.: empatia, organização, comunicação)',
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

export function buildServiceCommunityFormationDomainDto(
  seed: ServiceCommunityFormationDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildServiceCommunityFormationPathDto(
  seed: ServiceCommunityFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildServiceCommunityFormationCompetencyDto(
  seed: ServiceCommunityFormationCompetencySeed,
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
