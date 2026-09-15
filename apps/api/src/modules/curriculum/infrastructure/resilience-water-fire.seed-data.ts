import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 20 seed data: "Resiliência, Outdoor e Preparação
// Familiar" -- Água + Fogo ---
//
// The `RESILIENCE` LearningDomain already exists (PR #137), with
// `RESILIENCE.FIRST_AID` (#137) and `RESILIENCE.NAVIGATION` /
// `RESILIENCE.CAMPING` (#157) as sibling LearningPaths. This adds the
// second pair of the domain's six subsections as their own sibling
// LearningPaths -- Água (RESILIENCE.WATER) and Fogo (RESILIENCE.FIRE) --
// second of 3 sibling PRs (last: Emergências reais, given its larger
// item count).
//
// Item lists taken verbatim from issue #95 section 20:
//   Água: importância da hidratação, armazenamento, identificação de
//     fontes, tratamento seguro, filtragem, fervura, cuidados sanitários.
//   Fogo: segurança com fogo, prevenção de incêndios, uso supervisionado,
//     fogueira em ambiente permitido, extinção correta.
//
// Água's issue list is about safe water sourcing/treatment for outdoor
// use, not swimming -- so that's what's modeled here. It still folds in
// the project's water-risk safety principle where the item naturally
// touches it: RESILIENCE.WATER.SOURCE_IDENTIFICATION explicitly notes the
// drowning-risk/supervision framing for approaching a natural water
// source, and RESILIENCE.WATER.HYDRATION_IMPORTANCE ties hydration to
// physical exertion -- without inventing swimming/flotation items the
// issue's own list doesn't ask for.
//
// Fogo directly matches the project's strong child-safety principle
// (issue #95 section 35): every fire-related objective below carries
// explicit adult-supervision framing, and RESILIENCE.FIRE.CAMPFIRE is
// framed as "with direct adult supervision, in a permitted area" per the
// issue's own "fogueira em ambiente permitido" wording.
//
// Scope-neutrality: none of these competencies duplicate Culinária's
// (COOKING domain) cooking-technique competencies (using fire/heat to
// cook) or Ofícios' (TRADES domain) tool-safety competencies -- these are
// about outdoor water/fire survival literacy, not cooking or tool use.
// Primeiros Socorros, Navegação, Acampamento and Emergências reais terms
// are also kept out -- see the neutrality-scan integration test.
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed.

const DOMAIN_CODE = 'RESILIENCE';

export interface ResilienceWaterFireDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceWaterFirePathSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceWaterFireCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface ResilienceWaterFirePathSeedData {
  path: ResilienceWaterFirePathSeed;
  competencies: ResilienceWaterFireCompetencySeed[];
}

export interface ResilienceWaterFireSeedData {
  domain: ResilienceWaterFireDomainSeed;
  paths: ResilienceWaterFirePathSeedData[];
}

export function buildResilienceWaterFireSeedData(): ResilienceWaterFireSeedData {
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
          code: 'RESILIENCE.WATER',
          name: 'Água',
          description:
            'Trilha de água -- reconhecer a importância da hidratação, identificar e tratar fontes de água com segurança, sempre com supervisão de um adulto responsável perto de qualquer corpo d\'água (issue #95 seção 20, subseção "Água").',
        },
        competencies: [
          {
            code: 'RESILIENCE.WATER.HYDRATION_IMPORTANCE',
            title: 'Importância da Hidratação',
            level: 1,
            ageRecommendation: { min: 6, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar, com apoio de um adulto responsável, por que se hidratar é importante, especialmente durante esforço físico ou calor, e reconhecer sinais simples de sede e cansaço',
            ],
          },
          {
            code: 'RESILIENCE.WATER.STORAGE',
            title: 'Armazenamento de Água',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar, com apoio de um adulto responsável, como armazenar água potável com segurança em casa ou em uma saída, incluindo por que trocar a água guardada periodicamente',
            ],
          },
          {
            code: 'RESILIENCE.WATER.SOURCE_IDENTIFICATION',
            title: 'Identificação de Fontes de Água',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Identificar, com apoio de um adulto responsável, possíveis fontes de água ao ar livre e explicar por que nunca se aproximar de um rio, lago ou açude sozinho ou sem supervisão',
            ],
          },
          {
            code: 'RESILIENCE.WATER.SAFE_TREATMENT',
            title: 'Tratamento Seguro de Água',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar por que água de fontes naturais precisa ser tratada antes de beber, e quais métodos existem, sempre sob orientação de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.WATER.FILTERING',
            title: 'Filtragem de Água',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Demonstrar, com supervisão de um adulto responsável, o uso básico de um filtro de água simples',
            ],
          },
          {
            code: 'RESILIENCE.WATER.BOILING',
            title: 'Fervura de Água',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['observation'],
            starterObjectives: [
              'Explicar por que ferver a água é uma forma eficaz de torná-la segura para beber, e participar do processo apenas com supervisão direta de um adulto responsável perto do fogo',
            ],
          },
          {
            code: 'RESILIENCE.WATER.SANITARY_CARE',
            title: 'Cuidados Sanitários com a Água',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar hábitos básicos de higiene relacionados à água (lavar as mãos, não misturar água tratada com não tratada) com apoio de um adulto responsável',
            ],
          },
        ],
      },
      {
        path: {
          code: 'RESILIENCE.FIRE',
          name: 'Fogo',
          description:
            'Trilha de fogo -- reconhecer riscos, agir com segurança perto do fogo e ajudar a apagá-lo corretamente, sempre com supervisão direta de um adulto responsável (issue #95 seção 20, subseção "Fogo").',
        },
        competencies: [
          {
            code: 'RESILIENCE.FIRE.SAFETY',
            title: 'Segurança com Fogo',
            level: 1,
            ageRecommendation: { min: 6, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar as regras básicas de segurança perto do fogo (manter distância segura, nunca mexer sozinho, avisar um adulto imediatamente em caso de risco)',
            ],
          },
          {
            code: 'RESILIENCE.FIRE.PREVENTION',
            title: 'Prevenção de Incêndios Domésticos',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Identificar, com apoio de um adulto responsável, pelo menos três riscos comuns de incêndio em casa e como preveni-los',
            ],
          },
          {
            code: 'RESILIENCE.FIRE.SUPERVISED_USE',
            title: 'Uso Responsável e Supervisionado do Fogo',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['observation'],
            starterObjectives: [
              'Demonstrar o uso responsável do fogo em uma tarefa simples (ex.: acender uma vela, usar um fogareiro) sempre com supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.FIRE.CAMPFIRE',
            title: 'Acender Fogueira em Ambiente Permitido',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Participar da montagem e do acendimento de uma fogueira apenas em local e ambiente permitido, sempre sob supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.FIRE.EXTINGUISHING',
            title: 'Apagar Fogo com Segurança',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Demonstrar, com supervisão de um adulto responsável, a forma correta de apagar completamente uma fogueira ou fogo pequeno, garantindo que não há mais brasas',
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

export function buildResilienceWaterFireDomainDto(
  seed: ResilienceWaterFireDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildResilienceWaterFirePathDto(
  seed: ResilienceWaterFirePathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildResilienceWaterFireCompetencyDto(
  seed: ResilienceWaterFireCompetencySeed,
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
