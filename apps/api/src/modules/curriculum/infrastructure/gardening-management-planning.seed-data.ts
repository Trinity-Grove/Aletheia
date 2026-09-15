import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 19 seed data: "Plantio" -- Manejo + Planejamento ---
//
// The `GARDENING` LearningDomain already exists (PR #136), with
// `GARDENING.FOUNDATIONS` (#136) and `GARDENING.PRODUCTION` (previous PR)
// as sibling LearningPaths. This adds the domain's last two subsections as
// their own sibling LearningPaths -- Manejo (GARDENING.MANAGEMENT) and
// Planejamento (GARDENING.PLANNING) -- second and last of 2 sibling PRs
// covering issue #95 section 19's three remaining subsections, combined
// here given their smaller item counts.
//
// Item lists taken verbatim from issue #95 section 19:
//   Manejo: controle de pragas, manejo sustentável, colheita,
//     armazenamento, conservação.
//   Planejamento: calendário de plantio, registro de cultivo, diário da
//     horta, medição de produtividade, projeto de horta familiar.
//
// Manejo's pest-control item is modeled with an explicitly organic/manual
// approach and a tone appropriate for children, per the task's own
// instruction: identifying pests, physical/manual removal, companion
// planting and natural deterrents, never aggressive chemical pesticides
// (RESILIENCE.FIRE's adult-supervision framing is the closest sibling
// precedent for "keep this concrete and age-appropriate, not scary or
// adult-tooling-heavy").
//
// Scope-neutrality:
//   - Does not repeat GARDENING.FOUNDATIONS' or GARDENING.PRODUCTION's
//     competencies -- these two paths assume both already exist and build
//     the ongoing-care/harvest layer (Manejo) and the record-keeping/
//     project-planning layer (Planejamento) on top.
//   - GARDENING.MANAGEMENT.STORAGE and .PRESERVATION stay in
//     harvest-adjacent territory (keeping produce fresh: cool/dry/
//     ventilated storage, refrigeration, drying in the sun) and
//     deliberately avoid Culinária's (COOKING domain) cooking-based
//     preservation techniques -- canning, pickling, fermentation -- which
//     belong to COOKING's own "Conservação"/"Fermentação" Progressão items
//     (issue #95 section 18).
//   - GARDENING.MANAGEMENT.PEST_CONTROL references pests conceptually and
//     stays in organic/manual/preventive territory; it does not reference
//     or rebuild Ofícios' (TRADES domain) tool-safety competencies.
//   - GARDENING.PLANNING competencies are about the family's own
//     record-keeping habits (a calendar, a notebook, simple measurements)
//     and don't duplicate any subject-area content (e.g. no formal data
//     analysis/statistics -- that belongs to Matemática).
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed.

const DOMAIN_CODE = 'GARDENING';

export interface GardeningManagementPlanningDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface GardeningManagementPlanningPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface GardeningManagementPlanningCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface GardeningManagementPlanningPathSeedData {
  path: GardeningManagementPlanningPathSeed;
  competencies: GardeningManagementPlanningCompetencySeed[];
}

export interface GardeningManagementPlanningSeedData {
  domain: GardeningManagementPlanningDomainSeed;
  paths: GardeningManagementPlanningPathSeedData[];
}

export function buildGardeningManagementPlanningSeedData(): GardeningManagementPlanningSeedData {
  return {
    // Identical to gardening-formation.seed-data.ts's domain seed --
    // reused here only as a defensive fallback in case this seeder runs
    // before GardeningFormationSeeder. Whichever runs first creates the
    // domain; the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Plantio',
      description:
        'Formação em plantio como disciplina própria -- começando pela base biológica e prática que sustenta qualquer cultivo (germinação, solo, nutrientes, água, luz, ciclo de vida das plantas), antes de qualquer especialização em produção, manejo contínuo ou planejamento de cultivo (cada uma, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    paths: [
      {
        path: {
          code: 'GARDENING.MANAGEMENT',
          name: 'Manejo',
          description:
            'Trilha de manejo -- controle orgânico de pragas, manejo sustentável, colheita, armazenamento e conservação do que foi cultivado (issue #95 seção 19, subseção "Manejo").',
        },
        competencies: [
          {
            code: 'GARDENING.MANAGEMENT.PEST_CONTROL',
            title: 'Controle de Pragas',
            level: 2,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'text', 'observation'],
            starterObjectives: [
              'Identificar uma praga ou problema comum em uma planta e explicar pelo menos duas formas orgânicas e manuais de lidar com ela (remoção manual, plantio companheiro, repelente natural), sem uso de produtos químicos agressivos',
            ],
          },
          {
            code: 'GARDENING.MANAGEMENT.SUSTAINABLE_PRACTICES',
            title: 'Manejo Sustentável',
            level: 2,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar com as próprias palavras pelo menos duas práticas que tornam o cultivo mais sustentável (ex.: reaproveitar água, compostar restos, evitar desperdício de recursos)',
            ],
          },
          {
            code: 'GARDENING.MANAGEMENT.HARVESTING',
            title: 'Colheita',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Colher uma hortaliça, fruta ou tempero no ponto certo, explicando como identificar que a planta está pronta para a colheita',
            ],
          },
          {
            code: 'GARDENING.MANAGEMENT.STORAGE',
            title: 'Armazenamento',
            level: 2,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Explicar e demonstrar como armazenar corretamente um alimento colhido da horta (local fresco e seco, ventilação, refrigeração quando necessário) para que dure mais tempo',
            ],
          },
          {
            code: 'GARDENING.MANAGEMENT.PRESERVATION',
            title: 'Conservação',
            level: 2,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Explicar pelo menos uma forma simples de conservar um alimento colhido além do armazenamento comum (ex.: secagem ao sol de ervas ou temperos), sem entrar em técnicas culinárias de conserva',
            ],
          },
        ],
      },
      {
        path: {
          code: 'GARDENING.PLANNING',
          name: 'Planejamento',
          description:
            'Trilha de planejamento -- calendário de plantio, registro de cultivo, diário da horta, medição de produtividade e projeto de horta familiar (issue #95 seção 19, subseção "Planejamento").',
        },
        competencies: [
          {
            code: 'GARDENING.PLANNING.PLANTING_CALENDAR',
            title: 'Calendário de Plantio',
            level: 2,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Montar um calendário simples indicando quando plantar e colher pelo menos três plantas diferentes ao longo do ano',
            ],
          },
          {
            code: 'GARDENING.PLANNING.CULTIVATION_LOG',
            title: 'Registro de Cultivo',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Manter um registro simples (data de plantio, rega, observações) de pelo menos uma planta ao longo de todo o seu ciclo',
            ],
          },
          {
            code: 'GARDENING.PLANNING.GARDEN_JOURNAL',
            title: 'Diário da Horta',
            level: 1,
            ageRecommendation: { min: 6, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Manter um diário da horta por pelo menos quatro semanas, com anotações e fotos das mudanças observadas',
            ],
          },
          {
            code: 'GARDENING.PLANNING.PRODUCTIVITY_MEASUREMENT',
            title: 'Medição de Produtividade',
            level: 2,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Medir e registrar a quantidade colhida de uma planta (peso, contagem de unidades) e comparar com o que foi plantado, explicando o resultado com as próprias palavras',
            ],
          },
          {
            code: 'GARDENING.PLANNING.FAMILY_GARDEN_PROJECT',
            title: 'Projeto de Horta Familiar',
            level: 3,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['text', 'photo', 'observation'],
            starterObjectives: [
              'Planejar e conduzir, do início ao fim, um pequeno projeto de horta familiar (escolha das plantas, espaço, calendário e cuidados), apresentando o resultado final para a família',
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

export function buildGardeningManagementPlanningDomainDto(
  seed: GardeningManagementPlanningDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildGardeningManagementPlanningPathDto(
  seed: GardeningManagementPlanningPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildGardeningManagementPlanningCompetencyDto(
  seed: GardeningManagementPlanningCompetencySeed,
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
