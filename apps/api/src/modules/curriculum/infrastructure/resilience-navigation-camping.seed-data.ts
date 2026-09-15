import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 20 seed data: "Resiliência, Outdoor e Preparação
// Familiar" -- Navegação + Acampamento ---
//
// The `RESILIENCE` LearningDomain and its first LearningPath
// (`RESILIENCE.FIRST_AID`, "Primeiros Socorros") already exist (PR #137).
// This adds two more of the domain's six subsections as their own sibling
// LearningPaths -- Navegação (RESILIENCE.NAVIGATION) and Acampamento
// (RESILIENCE.CAMPING) -- first of 3 sibling PRs covering the remaining
// five subsections (this one: Navegação + Acampamento; next: Água + Fogo;
// last: Emergências reais, given its larger item count).
//
// Item lists taken verbatim from issue #95 section 20:
//   Navegação: leitura de mapas, orientação, bússola, pontos cardeais,
//     referências naturais, planejamento de rota.
//   Acampamento: montagem de barraca, abrigo, organização de
//     acampamento, escolha de local, segurança ambiental, Leave No Trace
//     ou princípios semelhantes.
//
// Scope-neutrality: Acampamento's issue list does NOT include a
// trail-cooking item, so none is written here -- no overlap with
// Culinária's (COOKING domain) cooking-technique competencies to guard
// against. Água, Fogo, Emergências reais and Primeiros Socorros terms are
// also kept out (each is its own LearningPath, this one or already
// shipped) -- see the neutrality-scan integration test.
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed, same as every other DOMAIN_PROFICIENCY
// domain (Música, Ofícios, Culinária, Plantio, Resiliência).
//
// Child-safety framing: every objective that touches outdoor risk
// (orientation error, tent/shelter setup, campsite selection) carries
// explicit adult-supervision or age-appropriateness language, matching
// the tone PR #137 established for Primeiros Socorros.

const DOMAIN_CODE = 'RESILIENCE';

export interface ResilienceNavigationCampingDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceNavigationCampingPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceNavigationCampingCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface ResilienceNavigationCampingPathSeedData {
  path: ResilienceNavigationCampingPathSeed;
  competencies: ResilienceNavigationCampingCompetencySeed[];
}

export interface ResilienceNavigationCampingSeedData {
  domain: ResilienceNavigationCampingDomainSeed;
  paths: ResilienceNavigationCampingPathSeedData[];
}

export function buildResilienceNavigationCampingSeedData(): ResilienceNavigationCampingSeedData {
  return {
    // Identical to resilience-formation.seed-data.ts's domain seed --
    // reused here only as a defensive fallback in case this seeder runs
    // before ResilienceFormationSeeder. Whichever runs first creates the
    // domain; the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Resiliência, Outdoor e Preparação Familiar',
      description:
        'Formação para preservar a vida, prevenir riscos e ajudar outras pessoas com calma e método -- começando pelos primeiros socorros, o ponto de partida mais universal e seguro, antes de qualquer trilha futura e separada desta mesma fundação (cada subseção do domínio, uma trilha própria). Foco constante em prevenção, segurança e cuidado com o próximo.',
    },
    paths: [
      {
        path: {
          code: 'RESILIENCE.NAVIGATION',
          name: 'Navegação',
          description:
            'Trilha de navegação -- orientar-se no espaço, ler um mapa, usar uma bússola e planejar um trajeto simples, sempre em ambiente conhecido e com supervisão de um adulto responsável (issue #95 seção 20, subseção "Navegação").',
        },
        competencies: [
          {
            code: 'RESILIENCE.NAVIGATION.MAP_READING',
            title: 'Leitura de Mapas',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Ler um mapa simples e identificar nele pontos de referência conhecidos (ex.: casa, escola, trilha), com apoio de um adulto',
            ],
          },
          {
            code: 'RESILIENCE.NAVIGATION.ORIENTATION_BASICS',
            title: 'Orientação Básica',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['observation'],
            starterObjectives: [
              'Explicar como se orientar em um ambiente conhecido usando pontos de referência visuais, sempre acompanhado de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.NAVIGATION.COMPASS',
            title: 'Uso de Bússola',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Demonstrar o uso básico de uma bússola para encontrar uma direção, com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.NAVIGATION.CARDINAL_POINTS',
            title: 'Pontos Cardeais',
            level: 1,
            ageRecommendation: { min: 6, max: 12 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Identificar os quatro pontos cardeais e explicar, com apoio de um adulto, como eles ajudam a se localizar',
            ],
          },
          {
            code: 'RESILIENCE.NAVIGATION.NATURAL_REFERENCES',
            title: 'Orientação por Elementos Naturais',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar como o sol e, à noite com supervisão de um adulto, estrelas conhecidas podem ajudar a indicar uma direção aproximada',
            ],
          },
          {
            code: 'RESILIENCE.NAVIGATION.ROUTE_PLANNING',
            title: 'Planejamento de Rota Simples',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Planejar, com apoio de um adulto responsável, uma rota simples e conhecida (ex.: trilha curta, caminho no bairro), incluindo pontos de parada e o que fazer se alguém se separar do grupo',
            ],
          },
        ],
      },
      {
        path: {
          code: 'RESILIENCE.CAMPING',
          name: 'Acampamento',
          description:
            'Trilha de acampamento -- montar e organizar um acampamento com segurança, escolher um local adequado e respeitar o ambiente, sempre sob supervisão de um adulto responsável em pernoite (issue #95 seção 20, subseção "Acampamento").',
        },
        competencies: [
          {
            code: 'RESILIENCE.CAMPING.TENT_SETUP',
            title: 'Montagem de Barraca',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Ajudar a montar uma barraca seguindo os passos corretos, com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.CAMPING.SHELTER',
            title: 'Abrigo',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar por que um abrigo protege do vento, chuva e frio, e identificar, com apoio de um adulto, o que torna um abrigo seguro',
            ],
          },
          {
            code: 'RESILIENCE.CAMPING.CAMP_ORGANIZATION',
            title: 'Organização de Acampamento',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Organizar o próprio equipamento de acampamento de forma acessível e segura, com apoio de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.CAMPING.SITE_SELECTION',
            title: 'Escolha de Local Seguro',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Identificar, com apoio de um adulto responsável, características de um bom local para acampar (terreno plano, distante de riscos como queda de galhos ou área sujeita a alagamento)',
            ],
          },
          {
            code: 'RESILIENCE.CAMPING.ENVIRONMENTAL_SAFETY',
            title: 'Segurança Ambiental',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Reconhecer riscos ambientais comuns de acampamento (animais, plantas, terreno) e explicar como reduzi-los com apoio de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.CAMPING.LEAVE_NO_TRACE',
            title: 'Etiqueta de Acampamento (Leave No Trace)',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar e praticar, com apoio de um adulto responsável, princípios de não deixar rastro (recolher o próprio lixo, não danificar plantas, deixar o local como foi encontrado)',
            ],
          },
          {
            code: 'RESILIENCE.CAMPING.SUPERVISED_OVERNIGHT',
            title: 'Pernoite Seguro Supervisionado',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['observation'],
            starterObjectives: [
              'Participar de um pernoite de acampamento sempre com supervisão direta de um adulto responsável, seguindo as regras de segurança combinadas previamente',
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

export function buildResilienceNavigationCampingDomainDto(
  seed: ResilienceNavigationCampingDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildResilienceNavigationCampingPathDto(
  seed: ResilienceNavigationCampingPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildResilienceNavigationCampingCompetencyDto(
  seed: ResilienceNavigationCampingCompetencySeed,
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
