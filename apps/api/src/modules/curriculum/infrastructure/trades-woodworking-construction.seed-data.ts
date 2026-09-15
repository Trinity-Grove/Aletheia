import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 15 seed data: "Ofícios" per-trade paths, group 1
// of 3 ("woodworking/construction") ---
//
// Issue #144 Lote 2 item 6 ("Ofícios tradicionais", 12 trades). The
// `TRADES` LearningDomain and its foundational safety LearningPath
// (`TRADES.FOUNDATIONS`) already exist from PR #134 -- this doesn't
// change or duplicate that: it adds new, trade-specific LearningPaths
// under the SAME domain, one per trade, for the trades the coordinator
// grouped as "woodworking/construction": Marcenaria (cabinetmaking),
// Carpintaria (carpentry), Construção simples (basic construction) and
// Ferramentas manuais (hand tools).
//
// Of the 12 trades listed in section 15, two are explicitly NOT
// duplicated here because they already have a full, separate
// LearningDomain elsewhere in the catalog:
//   - Culinária has its own LearningDomain (`COOKING`, PR #135,
//     "Culinária Fundamentos").
//   - Jardinagem overlaps with the `GARDENING` LearningDomain's
//     "Plantio Fundamentos" path (PR #136).
// Creating a redundant `TRADES.*` path for either would fragment the
// same subject across two domains with no clear source of truth. See
// the PR body for the explicit cross-reference decision instead.
//
// This first pass is deliberately shallow per trade (4 competencies
// each) -- broad coverage across many trades, not deep coverage of any
// single one, per the task's own framing. The domain-level safety
// competencies (tool safety, PPE, risk awareness, age/supervision) live
// once in TRADES.FOUNDATIONS and are NOT repeated here; each trade path
// assumes that foundation and adds only what's genuinely specific to it.
//
// This seeder is written to be runnable standalone (same defensive
// create-if-missing pattern as every other seeder in this file group):
// if TRADES doesn't exist yet, it creates it using the exact same
// code/name/description trades-formation.seed-data.ts already
// established, so re-running seeders in any order converges to the same
// state.

const DOMAIN_CODE = 'TRADES';

export interface TradesWoodworkingConstructionDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesWoodworkingConstructionPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesWoodworkingConstructionCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TradesWoodworkingConstructionPathSeedData {
  path: TradesWoodworkingConstructionPathSeed;
  competencies: TradesWoodworkingConstructionCompetencySeed[];
}

export interface TradesWoodworkingConstructionSeedData {
  domain: TradesWoodworkingConstructionDomainSeed;
  paths: TradesWoodworkingConstructionPathSeedData[];
}

export function buildTradesWoodworkingConstructionSeedData(): TradesWoodworkingConstructionSeedData {
  return {
    // Identical to trades-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // TradesFormationSeeder (e.g. a standalone invocation on a fresh
    // database). Whichever seeder runs first creates the domain; the
    // other finds it already present and is a no-op for the domain step.
    domain: {
      code: DOMAIN_CODE,
      name: 'Ofícios',
      description:
        'Formação para o trabalho manual e os ofícios tradicionais como disciplina própria -- começando pela base de segurança, uso de ferramentas e método que qualquer ofício exige, antes de qualquer especialização em um ofício tradicional específico (cada um, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    paths: [
      {
        path: {
          code: 'TRADES.CABINETMAKING',
          name: 'Marcenaria',
          description:
            'Introdução à marcenaria -- trabalho fino em madeira para móveis e objetos pequenos, a partir da base de segurança e uso de ferramentas já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.CABINETMAKING.WOOD_SELECTION',
            title: 'Seleção e Identificação de Madeiras',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Identificar pelo menos três tipos comuns de madeira e explicar para que tipo de projeto cada um é mais adequado',
            ],
          },
          {
            code: 'TRADES.CABINETMAKING.CUTTING_SHAPING',
            title: 'Corte e Modelagem Básica da Madeira',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Cortar e modelar uma peça de madeira simples usando uma ferramenta apropriada, com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.CABINETMAKING.JOINERY_BASICS',
            title: 'Uniões e Encaixes Simples',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Unir duas peças de madeira usando uma técnica simples de encaixe, cola ou parafuso, produzindo uma junção firme',
            ],
          },
          {
            code: 'TRADES.CABINETMAKING.SMALL_PROJECT',
            title: 'Projeto Simples de Marcenaria',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Planejar e concluir um pequeno projeto de marcenaria do início ao fim (ex.: porta-treco, banquinho pequeno, caixa), registrando o processo',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.CARPENTRY',
          name: 'Carpintaria',
          description:
            'Introdução à carpintaria -- estruturas simples em madeira (diferente da marcenaria, focada em suporte e construção, não em acabamento fino), a partir da base já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.CARPENTRY.STRUCTURAL_BASICS',
            title: 'Noções de Estrutura e Suporte em Madeira',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Explicar por que uma estrutura simples de madeira precisa de suporte e apoio adequados, dando um exemplo real',
            ],
          },
          {
            code: 'TRADES.CARPENTRY.NAILING_SCREWING',
            title: 'Técnicas de Prego e Parafuso',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Fixar duas peças de madeira usando pregos ou parafusos de forma segura e firme, com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.CARPENTRY.LEVELING_SQUARING',
            title: 'Nivelamento e Esquadro',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Usar um nível e um esquadro para verificar se uma peça ou estrutura simples está alinhada corretamente',
            ],
          },
          {
            code: 'TRADES.CARPENTRY.SMALL_STRUCTURE',
            title: 'Construção de Pequena Estrutura de Madeira',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Construir uma pequena estrutura de madeira (ex.: casinha de passarinho, suporte, prateleira simples) do início ao fim, com supervisão',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.BASIC_CONSTRUCTION',
          name: 'Construção Simples',
          description:
            'Introdução a materiais e técnicas básicas de construção civil simples, sempre supervisionada, a partir da base já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.BASIC_CONSTRUCTION.MATERIALS_INTRO',
            title: 'Materiais Básicos de Construção',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Identificar materiais básicos de construção (tijolo, cimento, areia, argamassa) e explicar para que serve cada um',
            ],
          },
          {
            code: 'TRADES.BASIC_CONSTRUCTION.MASONRY_INTRO',
            title: 'Noções de Alvenaria Simples',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['observation', 'photo'],
            starterObjectives: [
              'Observar ou participar, sob supervisão direta, do assentamento de tijolos ou blocos em uma pequena estrutura simples',
            ],
          },
          {
            code: 'TRADES.BASIC_CONSTRUCTION.MIXING_MORTAR',
            title: 'Preparo de Argamassa',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Preparar uma pequena quantidade de argamassa seguindo uma proporção simples, com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_CONSTRUCTION.SMALL_REPAIR',
            title: 'Pequeno Reparo ou Construção Simples Supervisionada',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Realizar um pequeno reparo ou construção simples (ex.: consertar um muro baixo, construir um canteiro de tijolos) com supervisão direta',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.HAND_TOOLS',
          name: 'Ferramentas Manuais',
          description:
            'Identificação e uso competente de um conjunto amplo de ferramentas manuais comuns -- vai além da segurança geral já coberta em TRADES.FOUNDATIONS, tratando do uso correto de cada ferramenta específica.',
        },
        competencies: [
          {
            code: 'TRADES.HAND_TOOLS.IDENTIFICATION',
            title: 'Identificação e Função de Ferramentas Manuais',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Identificar pelo menos oito ferramentas manuais comuns e explicar para que serve cada uma',
            ],
          },
          {
            code: 'TRADES.HAND_TOOLS.HAMMER_SCREWDRIVER',
            title: 'Uso de Martelo e Chave de Fenda/Phillips',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Usar corretamente um martelo e uma chave de fenda ou Phillips em uma tarefa simples, com supervisão',
            ],
          },
          {
            code: 'TRADES.HAND_TOOLS.SAW_BASICS',
            title: 'Uso Básico de Serrote',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Cortar uma peça de madeira simples usando um serrote manual de forma segura, com supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.HAND_TOOLS.WRENCH_PLIERS',
            title: 'Uso de Chave de Boca e Alicate',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Usar uma chave de boca e um alicate para apertar, soltar ou segurar uma peça simples, com supervisão',
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

export function buildTradesWoodworkingConstructionDomainDto(
  seed: TradesWoodworkingConstructionDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildTradesWoodworkingConstructionPathDto(
  seed: TradesWoodworkingConstructionPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildTradesWoodworkingConstructionCompetencyDto(
  seed: TradesWoodworkingConstructionCompetencySeed,
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
