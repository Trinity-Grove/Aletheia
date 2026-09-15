import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 18 seed data: "Culinária" (Vida prática) ---
//
// The `COOKING` LearningDomain already exists (PR #135), with
// `COOKING.FOUNDATIONS` (#135) and `COOKING.PROGRESSION` (#162) as
// sibling LearningPaths. This adds section 18's third and final
// subsection, "Vida prática", as a third sibling LearningPath
// (`COOKING.LIFE_SKILLS`).
//
// Item list taken verbatim from issue #95 section 18, subsection "Vida
// prática": lista de compras, orçamento, custo por refeição, organização
// de despensa, estoque doméstico, nutrição básica, planejamento
// alimentar familiar -- seven items, one competency per item.
//
// --- Domain-boundary decision (documented per this task's own
// requirement; also posted as a comment on issue #95) ---
//
// This subsection was previously left unbuilt (explicitly called out in
// cooking-formation.seed-data.ts, PR #135) because two of its seven
// items -- "orçamento" and "custo por refeição" -- read as potentially
// belonging to issue #95 section 22 "Educação financeira prática" (a
// never-started, broader personal-finance domain: orçamento doméstico,
// planejamento de compras, custo de projetos, economia, consumo
// responsável, planejamento, empreendedorismo) rather than to Culinária.
//
// The boundary applied here, consistent with how this catalog has
// scoped other adjacent-but-distinct content before (e.g. Resiliência's
// Água subsection scoped to potability/outdoor water safety, not
// swimming-pool culture, per PR #157/#160/#161's own judgment calls):
// a competency belongs to the domain whose skill it most directly
// trains, not the domain it is merely adjacent to.
//
//   - Every item in this path -- including orçamento and custo por
//     refeição -- is food-specific household logistics: a shopping list
//     for meals, a kitchen budget estimated against a shopping list, the
//     per-portion cost of a dish actually cooked, organizing a pantry,
//     tracking a home food inventory, basic food-group literacy, and
//     planning a family's weekly food routine. Each one trains a
//     cooking/household-management skill first -- the "orçamento" here
//     never grows past estimating and comparing the cost of a grocery
//     list, and "custo por refeição" never grows past a per-serving
//     division of a specific dish's ingredient cost. Neither one teaches
//     general budgeting method, income/expense tracking, saving,
//     debt, or financial goal-setting.
//   - Section 22's "Educação financeira prática" domain is therefore NOT
//     built here and stays explicitly out of scope: general personal/
//     family finance (orçamento doméstico as a full household budgeting
//     method spanning non-food expenses, poupança, dívida, juros,
//     empréstimo, cartão de crédito, renda, investimento,
//     empreendedorismo) belongs to that future domain, not to this one.
//     The scope-neutrality integration test enforces this by scanning
//     for those broader-finance terms across every competency here.
//
// Every objective below carries explicit "como habilidade de gestão da
// cozinha" framing on the two money-adjacent items (BUDGET,
// COST_PER_MEAL) specifically to keep the kitchen-management framing
// legible in the content itself, not just in this comment.
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed.

const DOMAIN_CODE = 'COOKING';
const PATH_CODE = 'COOKING.LIFE_SKILLS';

export interface CookingLifeSkillsDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface CookingLifeSkillsPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface CookingLifeSkillsCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface CookingLifeSkillsSeedData {
  domain: CookingLifeSkillsDomainSeed;
  path: CookingLifeSkillsPathSeed;
  competencies: CookingLifeSkillsCompetencySeed[];
}

export function buildCookingLifeSkillsSeedData(): CookingLifeSkillsSeedData {
  return {
    // Identical to cooking-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // CookingFormationSeeder. Whichever runs first creates the domain;
    // the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Culinária',
      description:
        'Formação culinária como disciplina própria -- começando pela base de higiene, segurança alimentar, uso de utensílios e método que qualquer preparo exige, antes de qualquer especialização técnica específica (cada uma, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    path: {
      code: PATH_CODE,
      name: 'Vida Prática na Cozinha',
      description:
        'Trilha de vida prática -- lista de compras, orçamento e custo por refeição como habilidades de gestão da cozinha, organização de despensa, estoque doméstico, nutrição básica e planejamento alimentar familiar (issue #95 seção 18, subseção "Vida prática"). Escopo deliberadamente limitado à logística de alimentação doméstica: não é educação financeira geral -- essa é uma trilha futura e separada (issue #95 seção 22).',
    },
    competencies: [
      {
        code: 'COOKING.LIFE_SKILLS.SHOPPING_LIST',
        title: 'Lista de Compras',
        level: 2,
        ageRecommendation: { min: 9, max: 16 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Elaborar uma lista de compras de alimentos para uma refeição ou uma semana, a partir de um cardápio planejado, organizando os itens por categoria',
        ],
      },
      {
        code: 'COOKING.LIFE_SKILLS.BUDGET',
        title: 'Orçamento da Cozinha',
        level: 2,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Estimar, como habilidade de gestão da cozinha (não como estudo geral de finanças pessoais), o valor aproximado de uma lista de compras de alimentos antes de ir ao mercado, e comparar com o valor efetivamente gasto',
        ],
      },
      {
        code: 'COOKING.LIFE_SKILLS.COST_PER_MEAL',
        title: 'Custo por Refeição',
        level: 2,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Calcular, como habilidade de gestão da cozinha, o custo aproximado de uma refeição simples que preparou, dividindo o custo total dos ingredientes pelo número de porções',
        ],
      },
      {
        code: 'COOKING.LIFE_SKILLS.PANTRY_ORGANIZATION',
        title: 'Organização de Despensa',
        level: 2,
        ageRecommendation: { min: 9, max: 16 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Organizar uma despensa ou armário de alimentos por categoria e validade, aplicando o princípio de usar primeiro o que vence primeiro',
        ],
      },
      {
        code: 'COOKING.LIFE_SKILLS.HOME_FOOD_STOCK',
        title: 'Estoque Doméstico',
        level: 2,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Manter um controle simples do estoque doméstico de alimentos, identificando o que falta e o que precisa ser reposto antes de ir ao mercado',
        ],
      },
      {
        code: 'COOKING.LIFE_SKILLS.BASIC_NUTRITION',
        title: 'Nutrição Básica',
        level: 2,
        ageRecommendation: { min: 9, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Reconhecer os grupos básicos de alimentos e explicar como montar um prato equilibrado para uma refeição do dia a dia',
        ],
      },
      {
        code: 'COOKING.LIFE_SKILLS.FAMILY_MEAL_PLANNING',
        title: 'Planejamento Alimentar Familiar',
        level: 2,
        ageRecommendation: { min: 11, max: 17 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Planejar, com apoio de um adulto responsável, a rotina alimentar semanal da família, considerando preferências, ingredientes disponíveis e tempo de preparo',
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

export function buildCookingLifeSkillsDomainDto(
  seed: CookingLifeSkillsDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildCookingLifeSkillsPathDto(
  seed: CookingLifeSkillsPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildCookingLifeSkillsCompetencyDto(
  seed: CookingLifeSkillsCompetencySeed,
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
