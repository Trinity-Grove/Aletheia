import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 21 seed data: "Autossuficiência doméstica" ---
//
// Same pattern as biblical-formation.seed-data.ts (section 5, PR #131),
// trades-formation.seed-data.ts (section 15, PR #134),
// cooking-formation.seed-data.ts (section 18, PR #135), and
// gardening-formation.seed-data.ts (section 19, PR #136): a brand-new
// Domain -> Path -> Competency slice, one LearningDomain ("Autossuficiência
// Doméstica"), one foundational LearningPath, one CompetencyDefinition per
// remaining item.
//
// Section 21's literal item list (12 items): cozinhar, limpar, organizar,
// lavar roupas, pequenos reparos, cuidar de ferramentas, plantar,
// planejar compras, controlar estoque, administrar recursos, noções
// básicas de manutenção doméstica, planejamento familiar.
//
// Three items are deliberately NOT duplicated here because they already
// have a dedicated home elsewhere in the catalog:
//   - "Cozinhar" -- the COOKING domain (PR #135 and follow-ups) already
//     covers cooking as its own discipline.
//   - "Pequenos reparos" -- TRADES.HOME_MAINTENANCE (PR #159) already
//     covers hands-on small home repairs (plumbing leaks, drywall
//     patching, hardware repair, home-inspection checklist).
//   - "Plantar" -- the GARDENING domain (PR #136 and follow-ups) already
//     covers planting/growing as its own discipline.
//
// "Cuidar de ferramentas" stays in scope here, but scoped to general
// day-to-day tool *care and storage* (cleaning, drying, organizing,
// preventing rust/damage between uses) -- not the hands-on repair
// technique or trade-specific tool use already covered under
// TRADES.FOUNDATIONS / TRADES.HOME_MAINTENANCE. "Noções básicas de
// manutenção doméstica" likewise stays deliberately non-hands-on here:
// broad home-systems literacy (knowing what a home's water/electrical/
// gas systems are, where shutoffs are, recognizing warning signs, and
// knowing when a task is DIY-safe vs. when to call a professional) that
// complements, rather than repeats, TRADES.HOME_MAINTENANCE's hands-on
// repair skills (PR #159's own coexistence note anticipated exactly this
// split).
//
// "Planejar compras" and "controlar estoque" stay deliberately
// food-neutral here: COOKING.LIFE_SKILLS (PR #165) already owns the
// food-specific version of both (shopping lists, pantry management,
// cost-per-meal) as household logistics for meals. Here they cover
// general household supplies (cleaning products, toiletries, and other
// non-food consumables) at a *logistics* level -- what to buy and when,
// based on usage and stock -- not a cost-comparison or budgeting
// exercise, which belongs to issue #95 section 22's own, separate
// "Educação financeira prática" domain (see
// personal-finance-foundations.seed-data.ts). "Administrar recursos"
// similarly stays scoped to non-monetary household resources here (time,
// energy, water, space) rather than money, for the same reason.
//
// Per createCompetencyDefinitionSchema's transform (packages/contracts/
// src/curriculum-definitions.ts), every competency parsed below through
// buildHomeSufficiencyFoundationsCompetencyDto automatically gets
// `metadata.progressionAxis` computed by `progressionMetadataForCode`
// (packages/contracts/src/educational-taxonomy.ts, PR #154): none of
// these codes match an EDUCATIONAL_STAGE path segment or
// `ADDITIONAL_LANGUAGE`, so every competency here resolves to
// `DOMAIN_PROFICIENCY` (skill-banded, not locked to one school grade),
// matching how TRADES/COOKING/GARDENING are classified in
// docs/architecture/universal-educational-taxonomy.md, with
// `educationalStages` derived from each competency's own
// `ageRecommendation`.

const DOMAIN_CODE = 'HOME_SUFFICIENCY';
const PATH_CODE = 'HOME_SUFFICIENCY.FOUNDATIONS';

export interface HomeSufficiencyFoundationsDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface HomeSufficiencyFoundationsPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface HomeSufficiencyFoundationsCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface HomeSufficiencyFoundationsSeedData {
  domain: HomeSufficiencyFoundationsDomainSeed;
  path: HomeSufficiencyFoundationsPathSeed;
  competencies: HomeSufficiencyFoundationsCompetencySeed[];
}

export function buildHomeSufficiencyFoundationsSeedData(): HomeSufficiencyFoundationsSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Autossuficiência Doméstica',
      description:
        'Formação para a administração do lar como disciplina própria -- limpeza, organização, lavagem de roupas, cuidado de ferramentas, planejamento e controle de compras e estoque domésticos, administração de recursos não financeiros do lar, noções básicas de manutenção doméstica e planejamento familiar -- complementar, e não sobreposta, ao que já existe em Culinária (cozinhar), Ofícios (pequenos reparos práticos) e Plantio (plantar).',
      },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Autossuficiência Doméstica',
      description:
        'Trilha fundamental de autossuficiência doméstica -- limpeza, organização, lavagem de roupas, cuidado de ferramentas, planejamento de compras, controle de estoque, administração de recursos, noções de manutenção doméstica e planejamento familiar (issue #95 seção 21).',
    },
    competencies: [
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.CLEANING',
        title: 'Limpeza Doméstica',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Limpar um cômodo completo seguindo uma sequência lógica (tirar o pó antes de varrer, varrer antes de passar pano, por exemplo), usando o produto adequado para cada tipo de superfície',
          'Explicar por que alguns produtos de limpeza não podem ser misturados entre si',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.ORGANIZATION',
        title: 'Organização de Espaços Domésticos',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Organizar um espaço doméstico (gaveta, armário ou prateleira), separando itens por categoria e descartando ou doando o que não é mais necessário',
          'Manter esse mesmo espaço organizado por pelo menos duas semanas, registrando em fotos o antes e o depois',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.LAUNDRY',
        title: 'Lavagem de Roupas',
        level: 1,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['observation', 'text'],
        starterObjectives: [
          'Separar uma carga de roupas por cor e tipo de tecido antes de lavar, explicando o motivo de cada separação',
          'Lavar, secar e guardar corretamente uma carga de roupas do início ao fim, escolhendo o programa ou método adequado ao tecido',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.TOOL_CARE',
        title: 'Cuidado de Ferramentas e Utensílios Domésticos',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Limpar, secar e guardar corretamente pelo menos cinco ferramentas ou utensílios domésticos comuns (ex.: vassoura, ferramentas de jardim, utensílios de limpeza) após o uso, evitando ferrugem ou dano',
          'Explicar por que guardar uma ferramenta suja ou molhada pode danificá-la com o tempo',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.HOUSEHOLD_PURCHASE_PLANNING',
        title: 'Planejamento de Compras Domésticas',
        level: 1,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Elaborar uma lista de compras de itens domésticos não alimentícios (ex.: produtos de limpeza, higiene) com base no que a casa realmente precisa e no ritmo de consumo observado, evitando compra em excesso ou falta',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.INVENTORY_CONTROL',
        title: 'Controle de Estoque Doméstico',
        level: 1,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Criar e manter por pelo menos um mês um controle simples (lista, planilha ou caderno) de estoque de itens domésticos não alimentícios, registrando quantidade disponível e ponto de reposição de cada item',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.RESOURCE_STEWARDSHIP',
        title: 'Administração de Recursos Domésticos',
        level: 1,
        ageRecommendation: { min: 9, max: 16 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Montar e seguir por pelo menos uma semana uma rotina que distribua tarefas domésticas ao longo dos dias, equilibrando tempo e energia disponíveis',
          'Identificar pelo menos três hábitos que reduzem o desperdício de água ou energia em casa e praticá-los por uma semana',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.HOME_SYSTEMS_LITERACY',
        title: 'Noções Básicas de Manutenção Doméstica',
        level: 1,
        ageRecommendation: { min: 11, max: 16 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Localizar e identificar em casa o registro geral de água e o disjuntor geral de energia, explicando quando cada um deve ser acionado',
          'Descrever, para pelo menos três sistemas básicos da casa (hidráulico, elétrico, aquecimento), um sinal de alerta que indica problema e se a situação é segura para um adulto resolver sozinho ou exige um profissional',
        ],
      },
      {
        code: 'HOME_SUFFICIENCY.FOUNDATIONS.FAMILY_PLANNING',
        title: 'Planejamento Familiar Doméstico',
        level: 1,
        ageRecommendation: { min: 10, max: 16 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Criar, junto com a família, uma agenda ou quadro semanal que organize tarefas domésticas, compromissos e responsabilidades de cada membro da família, e usá-lo por pelo menos duas semanas',
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

export function buildHomeSufficiencyFoundationsDomainDto(
  seed: HomeSufficiencyFoundationsDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildHomeSufficiencyFoundationsPathDto(
  seed: HomeSufficiencyFoundationsPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildHomeSufficiencyFoundationsCompetencyDto(
  seed: HomeSufficiencyFoundationsCompetencySeed,
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
