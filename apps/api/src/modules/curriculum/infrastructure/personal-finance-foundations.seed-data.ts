import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 22 seed data: "Educação financeira prática" ---
//
// Same pattern as biblical-formation.seed-data.ts (section 5, PR #131)
// through home-sufficiency-foundations.seed-data.ts (section 21, PR
// #168): a brand-new Domain -> Path -> Competency slice, one
// LearningDomain ("Educação Financeira Prática"), one foundational
// LearningPath, and one CompetencyDefinition per item in section 22's
// literal list (7 items): orçamento doméstico, planejamento de compras,
// custo de projetos, economia, consumo responsável, planejamento,
// empreendedorismo.
//
// Section 22 is explicitly framed in the issue itself as "expansão
// coerente, não requisito originalmente central" -- a genuinely new,
// never-started domain, distinct from every other domain that touches
// money-adjacent or purchase-adjacent topics elsewhere in the catalog:
//
//   - COOKING.LIFE_SKILLS (PR #165, "Vida Prática" path under Culinária)
//     already owns the FOOD-SPECIFIC version of household purchase
//     logistics: shopping lists, cost-per-meal, pantry/stock management,
//     family meal planning. Nothing here repeats that -- every
//     competency below is framed around general (non-food) household
//     finances, small projects, or entrepreneurship, never a grocery
//     list or a recipe's cost.
//   - HOME_SUFFICIENCY.FOUNDATIONS (PR #168, section 21) already owns
//     the LOGISTICS-ONLY version of "planejar compras" and "controlar
//     estoque" for general household (non-food) supplies -- what to buy
//     and when, based on usage and stock, with no cost-comparison or
//     budgeting judgment involved. HOME_SUFFICIENCY.FOUNDATIONS.HOUSEHOLD_PURCHASE_PLANNING
//     is a shopping-list exercise; PERSONAL_FINANCE.FOUNDATIONS.PURCHASE_PLANNING
//     below is a financial *decision* exercise (needs vs. wants,
//     comparing prices/options, evaluating whether and when to buy) --
//     the two are complementary, not duplicative.
//
// Section 22's own list repeats the word "planejamento" twice with
// different scope: item 2 ("planejamento de compras") is the financial
// evaluation of a specific purchase decision; item 6 ("planejamento",
// standalone) is broader financial goal-setting (setting and pursuing a
// financial goal over time). Both are seeded as distinct competencies
// below, matching the issue's own two-item framing rather than
// collapsing them into one.
//
// Per createCompetencyDefinitionSchema's transform (packages/contracts/
// src/curriculum-definitions.ts), every competency parsed below through
// buildPersonalFinanceFoundationsCompetencyDto automatically gets
// `metadata.progressionAxis` computed by `progressionMetadataForCode`
// (packages/contracts/src/educational-taxonomy.ts, PR #154): none of
// these codes match an EDUCATIONAL_STAGE path segment or
// `ADDITIONAL_LANGUAGE`, so every competency here resolves to
// `DOMAIN_PROFICIENCY` (skill-banded, not locked to one school grade),
// matching how TRADES/COOKING/GARDENING/HOME_SUFFICIENCY are classified
// in docs/architecture/universal-educational-taxonomy.md, with
// `educationalStages` derived from each competency's own
// `ageRecommendation`.

const DOMAIN_CODE = 'PERSONAL_FINANCE';
const PATH_CODE = 'PERSONAL_FINANCE.FOUNDATIONS';

export interface PersonalFinanceFoundationsDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface PersonalFinanceFoundationsPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface PersonalFinanceFoundationsCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface PersonalFinanceFoundationsSeedData {
  domain: PersonalFinanceFoundationsDomainSeed;
  path: PersonalFinanceFoundationsPathSeed;
  competencies: PersonalFinanceFoundationsCompetencySeed[];
}

export function buildPersonalFinanceFoundationsSeedData(): PersonalFinanceFoundationsSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Educação Financeira Prática',
      description:
        'Formação em educação financeira prática como disciplina própria -- orçamento doméstico, avaliação de compras, custo de projetos, poupança, consumo responsável, planejamento de metas financeiras e noções de empreendedorismo -- geral e não específica de alimentação: complementar, e não sobreposta, ao que já existe em Culinária (logística de compras e despensa para refeições) e em Autossuficiência Doméstica (logística de compras e estoque de itens domésticos não alimentícios).',
      },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Educação Financeira Prática',
      description:
        'Trilha fundamental de educação financeira prática -- orçamento doméstico, planejamento de compras, custo de projetos, economia, consumo responsável, planejamento de metas financeiras e empreendedorismo (issue #95 seção 22).',
    },
    competencies: [
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.HOUSEHOLD_BUDGET',
        title: 'Orçamento Doméstico',
        level: 1,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Montar um orçamento simples de um mês (real ou simulado) organizando entradas e saídas em categorias, mostrando se o saldo do mês é positivo ou negativo',
          'Acompanhar esse orçamento por pelo menos duas semanas, registrando gastos reais e comparando com o planejado',
        ],
      },
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.PURCHASE_PLANNING',
        title: 'Planejamento de Compras',
        level: 1,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Avaliar uma decisão de compra específica comparando pelo menos duas opções (preço, qualidade, necessidade real) e justificando por escrito a escolha final',
          'Explicar a diferença entre uma compra por necessidade e uma compra por impulso, usando um exemplo real ou hipotético',
        ],
      },
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.PROJECT_COSTING',
        title: 'Custo de Projetos',
        level: 1,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Estimar o custo total de um pequeno projeto (ex.: um projeto escolar, uma festa simples, uma pequena reforma) listando cada item de material, tempo ou serviço necessário e seu custo aproximado',
          'Comparar o custo estimado de um projeto com o custo final real, explicando as diferenças encontradas',
        ],
      },
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.SAVING',
        title: 'Economia',
        level: 1,
        ageRecommendation: { min: 9, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Definir uma meta de economia (valor e prazo) e separar uma parte da mesada, renda ou dinheiro recebido em direção a essa meta por pelo menos um mês, registrando o progresso',
          'Explicar com as próprias palavras pelo menos duas estratégias diferentes para economizar dinheiro',
        ],
      },
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.RESPONSIBLE_CONSUMPTION',
        title: 'Consumo Responsável',
        level: 1,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Avaliar uma escolha de consumo considerando pelo menos três fatores (custo, necessidade real, impacto no orçamento ou no ambiente) e registrar essa avaliação por escrito',
          'Identificar pelo menos três hábitos de consumo que podem ser ajustados para reduzir desperdício de dinheiro',
        ],
      },
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.FINANCIAL_GOAL_PLANNING',
        title: 'Planejamento de Metas Financeiras',
        level: 1,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Definir uma meta financeira de curto ou médio prazo e criar um plano com passos concretos e prazos para alcançá-la',
          'Revisar esse plano após pelo menos um mês, ajustando os passos com base no progresso real',
        ],
      },
      {
        code: 'PERSONAL_FINANCE.FOUNDATIONS.ENTREPRENEURSHIP',
        title: 'Empreendedorismo',
        level: 1,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Planejar e executar um pequeno empreendimento (ex.: venda de um produto simples ou prestação de um pequeno serviço), calculando custo, preço de venda e lucro ou prejuízo ao final',
          'Explicar com as próprias palavras a diferença entre custo, preço de venda e lucro, usando o próprio empreendimento como exemplo',
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

export function buildPersonalFinanceFoundationsDomainDto(
  seed: PersonalFinanceFoundationsDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildPersonalFinanceFoundationsPathDto(
  seed: PersonalFinanceFoundationsPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildPersonalFinanceFoundationsCompetencyDto(
  seed: PersonalFinanceFoundationsCompetencySeed,
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
