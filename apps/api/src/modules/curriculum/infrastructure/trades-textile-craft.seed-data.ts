import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 15 seed data: "Ofícios" per-trade paths, group 2
// of 3 ("textile/craft") ---
//
// Issue #144 Lote 2 item 6 ("Ofícios tradicionais", 12 trades). The
// `TRADES` LearningDomain and its foundational safety LearningPath
// (`TRADES.FOUNDATIONS`, PR #134) already exist -- this doesn't change
// or duplicate that: it adds new, trade-specific LearningPaths under the
// SAME domain, one per trade, for the trades grouped as "textile/craft":
// Costura (sewing), Artesanato (crafts/handicraft) and Pintura
// Residencial (home painting).
//
// Second of 3 sibling PRs for this item, following
// trades-woodworking-construction.seed-data.ts (PR #152, group 1:
// Marcenaria, Carpintaria, Construção Simples, Ferramentas Manuais).
// Culinária and Jardinagem remain intentionally NOT duplicated here
// (they already have their own LearningDomains, `COOKING` and
// `GARDENING` -- see #152's PR body for the full cross-reference
// rationale, unchanged in this PR).
//
// This first pass is deliberately shallow per trade (4 competencies
// each) -- broad coverage across many trades, not deep coverage of any
// single one. The domain-level safety competencies (tool safety, PPE,
// risk awareness, age/supervision) live once in TRADES.FOUNDATIONS and
// are NOT repeated here.
//
// Same defensive create-if-missing pattern as
// trades-woodworking-construction.seeder.ts: if TRADES doesn't exist
// yet, this seeder creates it using the exact same code/name/description
// trades-formation.seed-data.ts already established, so re-running
// seeders in any order converges to the same state.

const DOMAIN_CODE = 'TRADES';

export interface TradesTextileCraftDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesTextileCraftPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesTextileCraftCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TradesTextileCraftPathSeedData {
  path: TradesTextileCraftPathSeed;
  competencies: TradesTextileCraftCompetencySeed[];
}

export interface TradesTextileCraftSeedData {
  domain: TradesTextileCraftDomainSeed;
  paths: TradesTextileCraftPathSeedData[];
}

export function buildTradesTextileCraftSeedData(): TradesTextileCraftSeedData {
  return {
    // Identical to trades-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // TradesFormationSeeder. Whichever seeder runs first creates the
    // domain; the other finds it already present and is a no-op for the
    // domain step.
    domain: {
      code: DOMAIN_CODE,
      name: 'Ofícios',
      description:
        'Formação para o trabalho manual e os ofícios tradicionais como disciplina própria -- começando pela base de segurança, uso de ferramentas e método que qualquer ofício exige, antes de qualquer especialização em um ofício tradicional específico (cada um, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    paths: [
      {
        path: {
          code: 'TRADES.SEWING',
          name: 'Costura',
          description:
            'Introdução à costura -- do ponto à mão a um pequeno projeto costurado à máquina, a partir da base de segurança e uso de ferramentas já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.SEWING.HAND_STITCHING',
            title: 'Costura à Mão Básica',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Realizar pelo menos dois tipos de ponto à mão (ex.: ponto reto, ponto de alinhavo) em um pedaço de tecido',
            ],
          },
          {
            code: 'TRADES.SEWING.MACHINE_BASICS',
            title: 'Noções de Máquina de Costura',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Enfiar a linha e costurar uma linha reta simples em uma máquina de costura, com supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.SEWING.BUTTON_REPAIR',
            title: 'Reparo de Botão e Bainha Simples',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Costurar um botão firmemente e fazer uma bainha simples em uma peça de roupa',
            ],
          },
          {
            code: 'TRADES.SEWING.SMALL_PROJECT',
            title: 'Pequeno Projeto de Costura',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Planejar e concluir um pequeno projeto de costura do início ao fim (ex.: almofada, bolsa simples, fronha), registrando o processo',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.CRAFTS',
          name: 'Artesanato',
          description:
            'Introdução ao artesanato -- exploração de materiais e técnicas manuais para criar peças próprias, a partir da base já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.CRAFTS.MATERIALS_EXPLORATION',
            title: 'Exploração de Materiais para Artesanato',
            level: 1,
            ageRecommendation: { min: 6, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Explorar pelo menos três materiais diferentes (ex.: papel, argila, fibras, lã, madeira reaproveitada) para uma atividade artesanal',
            ],
          },
          {
            code: 'TRADES.CRAFTS.TECHNIQUE_BASICS',
            title: 'Técnica Artesanal Básica',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Aprender e demonstrar uma técnica artesanal básica (ex.: tricô, crochê, cerâmica simples, trançado, macramê)',
            ],
          },
          {
            code: 'TRADES.CRAFTS.FINISHING_PRESENTATION',
            title: 'Acabamento e Apresentação de Peça Artesanal',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Dar acabamento cuidadoso a uma peça artesanal e apresentá-la de forma organizada (ex.: embalagem simples, etiqueta)',
            ],
          },
          {
            code: 'TRADES.CRAFTS.SMALL_PROJECT',
            title: 'Peça Artesanal Concluída do Início ao Fim',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Planejar e concluir uma peça artesanal do início ao fim, registrando o processo e o resultado final',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.HOME_PAINTING',
          name: 'Pintura Residencial',
          description:
            'Introdução à pintura residencial -- preparo de superfície, uso correto de ferramentas de pintura e acabamento, a partir da base já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.HOME_PAINTING.SURFACE_PREP',
            title: 'Preparo de Superfície para Pintura',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Preparar uma superfície simples para pintura (limpeza, lixamento leve, fita crepe de proteção) antes de aplicar tinta',
            ],
          },
          {
            code: 'TRADES.HOME_PAINTING.TOOL_USE',
            title: 'Uso de Pincel, Rolo e Fita Crepe',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Usar corretamente um pincel e um rolo de pintura, incluindo como carregar tinta sem excesso e evitar respingos',
            ],
          },
          {
            code: 'TRADES.HOME_PAINTING.COLOR_APPLICATION',
            title: 'Aplicação de Tinta com Acabamento Uniforme',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Aplicar uma ou mais demãos de tinta em uma superfície pequena, obtendo um acabamento uniforme e sem falhas visíveis',
            ],
          },
          {
            code: 'TRADES.HOME_PAINTING.CLEANUP_SAFETY',
            title: 'Limpeza e Descarte Seguro de Materiais de Pintura',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Limpar corretamente pincéis e ferramentas após o uso e descartar restos de tinta e materiais de forma segura e adequada',
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

export function buildTradesTextileCraftDomainDto(
  seed: TradesTextileCraftDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildTradesTextileCraftPathDto(
  seed: TradesTextileCraftPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildTradesTextileCraftCompetencyDto(
  seed: TradesTextileCraftCompetencySeed,
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
