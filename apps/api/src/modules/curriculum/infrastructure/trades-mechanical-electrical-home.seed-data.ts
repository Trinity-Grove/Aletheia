import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 15 seed data: "Ofícios" per-trade paths, group 3
// of 3 ("mechanical/electrical/home maintenance") ---
//
// Issue #144 Lote 2 item 6 ("Ofícios tradicionais", 12 trades). The
// `TRADES` LearningDomain and its foundational safety LearningPath
// (`TRADES.FOUNDATIONS`, PR #134) already exist -- this doesn't change
// or duplicate that: it adds new, trade-specific LearningPaths under the
// SAME domain, one per trade, for the trades grouped as "mechanical/
// electrical/home maintenance": Mecânica Básica (basic mechanics),
// Elétrica Básica (basic electrical) and Manutenção Residencial (home
// maintenance).
//
// Third and final of 3 sibling PRs for this item, following
// trades-woodworking-construction.seed-data.ts (PR #152, group 1:
// Marcenaria, Carpintaria, Construção Simples, Ferramentas Manuais) and
// trades-textile-craft.seed-data.ts (PR #153, group 2: Costura,
// Artesanato, Pintura Residencial). Culinária and Jardinagem remain
// intentionally NOT duplicated here (they already have their own
// LearningDomains, `COOKING` and `GARDENING` -- see #152's PR body for
// the full cross-reference rationale, unchanged in this PR). Home
// painting is also intentionally NOT repeated in "Manutenção
// Residencial" below: it already has its own path, `TRADES.HOME_PAINTING`
// (PR #153) -- this path instead covers plumbing, drywall/patching,
// hardware repair and general home-repair literacy.
//
// This group carries more competencies per trade (8-10, vs. 4 in groups
// 1 and 2) per the task's own framing for this final slice. The
// domain-level safety competencies (tool safety, PPE, risk awareness,
// age/supervision) live once in TRADES.FOUNDATIONS and are NOT repeated
// here.
//
// Elétrica Básica in particular carries extra-explicit safety/supervision
// language throughout, given the real shock risk involved (issue #95
// section 35's child-safety principle) -- every hands-on objective that
// touches a live circuit, switch, wiring or panel requires the circuit to
// be de-energized first and a responsible adult directly present, never
// just "recommended".
//
// Same defensive create-if-missing pattern as
// trades-woodworking-construction.seeder.ts / trades-textile-craft.seeder.ts:
// if TRADES doesn't exist yet, this seeder creates it using the exact
// same code/name/description trades-formation.seed-data.ts already
// established, so re-running seeders in any order converges to the same
// state.
//
// Per createCompetencyDefinitionSchema's transform (packages/contracts/
// src/curriculum-definitions.ts), every competency parsed below through
// buildTradesMechanicalElectricalHomeCompetencyDto automatically gets
// `metadata.progressionAxis` computed by `progressionMetadataForCode`
// (packages/contracts/src/educational-taxonomy.ts, PR #154): none of
// these codes match an EDUCATIONAL_STAGE path segment or
// `ADDITIONAL_LANGUAGE`, so every competency here resolves to
// `DOMAIN_PROFICIENCY` (skill-banded, not locked to one school grade) --
// exactly matching `docs/architecture/universal-educational-taxonomy.md`'s
// classification of Ofícios -- with `educationalStages` derived from each
// competency's own `ageRecommendation`.

const DOMAIN_CODE = 'TRADES';

export interface TradesMechanicalElectricalHomeDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesMechanicalElectricalHomePathSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesMechanicalElectricalHomeCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TradesMechanicalElectricalHomePathSeedData {
  path: TradesMechanicalElectricalHomePathSeed;
  competencies: TradesMechanicalElectricalHomeCompetencySeed[];
}

export interface TradesMechanicalElectricalHomeSeedData {
  domain: TradesMechanicalElectricalHomeDomainSeed;
  paths: TradesMechanicalElectricalHomePathSeedData[];
}

export function buildTradesMechanicalElectricalHomeSeedData(): TradesMechanicalElectricalHomeSeedData {
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
          code: 'TRADES.BASIC_MECHANICS',
          name: 'Mecânica Básica',
          description:
            'Introdução à mecânica básica -- reparo de bicicleta, noções de motor pequeno e diagnóstico simples de problemas mecânicos, a partir da base de segurança e uso de ferramentas já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.BASIC_MECHANICS.TOOL_IDENTIFICATION',
            title: 'Identificação de Ferramentas de Mecânica Básica',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Identificar pelo menos seis ferramentas usadas em mecânica básica de bicicleta (ex.: chave allen, alavanca de pneu, chave de raio) e explicar para que serve cada uma',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.TIRE_REPAIR',
            title: 'Troca de Câmara de Ar de Bicicleta',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Trocar uma câmara de ar de bicicleta com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.CHAIN_MAINTENANCE',
            title: 'Limpeza e Lubrificação de Corrente',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Limpar e lubrificar corretamente a corrente de uma bicicleta, evitando excesso de lubrificante',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.BRAKE_ADJUSTMENT',
            title: 'Ajuste Básico de Freios de Bicicleta',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Ajustar a tensão e o alinhamento dos freios de uma bicicleta, com supervisão de um adulto responsável, verificando o funcionamento antes de andar',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.GEAR_ADJUSTMENT',
            title: 'Ajuste Básico de Marchas',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Ajustar o câmbio de uma bicicleta para que as marchas troquem suavemente, com supervisão de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.SMALL_ENGINE_AWARENESS',
            title: 'Noções de Motor Pequeno',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Identificar as partes básicas de um motor pequeno (ex.: cortador de grama, gerador) e explicar sua função, sem ligar ou operar o motor sozinho',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.FLUID_CHECK_SAFETY',
            title: 'Verificação Segura de Fluidos',
            level: 1,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Verificar o nível de um fluido básico (ex.: óleo) em um equipamento pequeno apenas com o equipamento desligado e frio, sob supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.DIAGNOSTIC_BASICS',
            title: 'Diagnóstico Básico de Problemas Mecânicos',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Reconhecer pelo menos três sinais comuns de problema mecânico em uma bicicleta (ex.: pneu murcho, corrente frouxa, freio fraco) e descrever a causa provável de cada um',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.SAFETY_MOVING_PARTS',
            title: 'Segurança em Torno de Peças Móveis',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar pelo menos três cuidados de segurança ao trabalhar perto de peças móveis ou giratórias (ex.: prender cabelo e roupas soltas, nunca tocar peça em movimento, desligar o equipamento antes de mexer) e demonstrar essa prática durante um reparo supervisionado',
            ],
          },
          {
            code: 'TRADES.BASIC_MECHANICS.SMALL_PROJECT',
            title: 'Reparo Mecânico Simples do Início ao Fim',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Planejar e concluir um pequeno reparo mecânico (ex.: revisão geral de uma bicicleta) do início ao fim, com supervisão direta de um adulto responsável, registrando o processo',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.BASIC_ELECTRICAL',
          name: 'Elétrica Básica',
          description:
            'Introdução à eletricidade básica residencial -- circuitos simples, interruptores, uso de multímetro e práticas seguras de fiação, sempre com o circuito desenergizado e supervisão direta de um adulto responsável, dado o risco real de choque elétrico. Parte da base de segurança já estabelecida em TRADES.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'TRADES.BASIC_ELECTRICAL.SHOCK_SAFETY_FUNDAMENTALS',
            title: 'Fundamentos de Segurança Elétrica',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar por que a eletricidade pode ser perigosa e listar pelo menos quatro regras de segurança elétrica (ex.: nunca tocar fio desencapado, nunca usar tomada com mãos molhadas, sempre desligar o disjuntor antes de reparar, nunca trabalhar em instalação elétrica sem supervisão de um adulto)',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.CIRCUIT_BASICS',
            title: 'Noções de Circuito Elétrico Simples',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Montar um circuito elétrico simples de baixa tensão (pilha, fio, lâmpada ou LED e interruptor) e explicar como a corrente circula',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.COMPONENT_IDENTIFICATION',
            title: 'Identificação de Componentes Elétricos Residenciais',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Identificar interruptores, tomadas, disjuntores e fusíveis em uma instalação residencial e explicar a função de cada um, sem manuseá-los',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.CIRCUIT_BREAKER_SAFETY',
            title: 'Uso Seguro do Disjuntor',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Localizar o quadro de disjuntores da casa e demonstrar como desligar o disjuntor correto antes de qualquer reparo elétrico, sempre com supervisão direta de um adulto responsável presente e orientando',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.MULTIMETER_BASICS',
            title: 'Uso Básico de Multímetro',
            level: 1,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Usar um multímetro para testar continuidade ou confirmar que um circuito está desenergizado, com supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.SWITCH_REPLACEMENT',
            title: 'Substituição de Interruptor Simples',
            level: 1,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Identificar e substituir um interruptor simples desenergizado com supervisão direta de um adulto responsável, confirmando com o multímetro que o circuito está sem energia antes de tocar em qualquer fio',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.WIRING_BASICS',
            title: 'Práticas Básicas de Fiação Segura',
            level: 1,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Conectar dois fios de baixa tensão usando um conector apropriado, seguindo práticas seguras de fiação, com o circuito desenergizado e supervisão direta e constante de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.BULB_FIXTURE_REPLACEMENT',
            title: 'Troca Segura de Lâmpada e Luminária Simples',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Trocar uma lâmpada ou luminária simples com o interruptor desligado e, quando aplicável, o disjuntor desligado, verificando a segurança antes de começar e com supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.TOOL_SAFETY_ELECTRICAL',
            title: 'Uso de Ferramentas Isoladas',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar por que ferramentas com cabo isolado são usadas em trabalhos elétricos e identificar pelo menos três delas (ex.: chave de fenda isolada, alicate isolado, testador de tensão)',
            ],
          },
          {
            code: 'TRADES.BASIC_ELECTRICAL.SMALL_PROJECT',
            title: 'Tarefa Elétrica Simples Supervisionada do Início ao Fim',
            level: 1,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Planejar e concluir uma pequena tarefa elétrica segura (ex.: trocar um interruptor, testar uma tomada com o multímetro) do início ao fim, com supervisão direta e constante de um adulto responsável, registrando o processo',
            ],
          },
        ],
      },
      {
        path: {
          code: 'TRADES.HOME_MAINTENANCE',
          name: 'Manutenção Residencial',
          description:
            'Introdução à manutenção residencial básica -- hidráulica simples, reparo de drywall e literacia geral de reparos domésticos, a partir da base já estabelecida em TRADES.FOUNDATIONS. Pintura residencial já tem sua própria trilha (TRADES.HOME_PAINTING) e não é repetida aqui.',
        },
        competencies: [
          {
            code: 'TRADES.HOME_MAINTENANCE.PLUMBING_COMPONENTS',
            title: 'Identificação de Componentes Hidráulicos Básicos',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Identificar componentes hidráulicos básicos de uma casa (registro, torneira, sifão, mangueira flexível) e explicar a função de cada um',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.FAUCET_LEAK_FIX',
            title: 'Reparo de Vazamento Simples em Torneira',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Identificar a causa de um vazamento simples em uma torneira (ex.: vedação gasta) e trocá-la, com o registro de água fechado e supervisão direta de um adulto responsável',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.DRAIN_CLOG',
            title: 'Desentupimento Básico de Ralo ou Pia',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Desentupir um ralo ou pia usando uma ferramenta básica apropriada (ex.: desentupidor de borracha), sem uso de produtos químicos corrosivos',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.DRYWALL_PATCH',
            title: 'Reparo de Furo Pequeno em Parede de Drywall',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Preparar e aplicar massa para reparar um furo pequeno em uma parede de drywall, alisando a superfície com uma espátula até ficar nivelada',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.SEALANT_APPLICATION',
            title: 'Aplicação de Vedante em Frestas',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Aplicar vedante (silicone ou similar) de forma uniforme em uma fresta simples ao redor de uma pia ou box',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.HARDWARE_REPAIR',
            title: 'Reparo de Dobradiça e Maçaneta',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Reapertar ou substituir uma dobradiça ou maçaneta solta em uma porta',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.HOME_INSPECTION_CHECKLIST',
            title: 'Checklist de Inspeção Residencial Básica',
            level: 1,
            ageRecommendation: { min: 9, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Percorrer a casa usando um checklist simples e identificar pelo menos cinco itens que precisam de manutenção (ex.: vazamento, dobradiça solta, fresta aberta)',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.TOOL_SAFETY_HOME',
            title: 'Segurança com Ferramentas de Manutenção Residencial',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar o uso seguro de pelo menos três ferramentas comuns de manutenção residencial (ex.: estilete, furadeira, escada) e os riscos de cada uma, com supervisão direta de um adulto responsável ao usá-las',
            ],
          },
          {
            code: 'TRADES.HOME_MAINTENANCE.SMALL_PROJECT',
            title: 'Pequeno Reparo Residencial do Início ao Fim',
            level: 1,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['photo', 'video', 'text'],
            starterObjectives: [
              'Planejar e concluir um pequeno reparo de manutenção residencial (ex.: consertar um vazamento, reparar um furo em drywall) do início ao fim, com supervisão direta de um adulto responsável, registrando o processo',
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

export function buildTradesMechanicalElectricalHomeDomainDto(
  seed: TradesMechanicalElectricalHomeDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildTradesMechanicalElectricalHomePathDto(
  seed: TradesMechanicalElectricalHomePathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildTradesMechanicalElectricalHomeCompetencyDto(
  seed: TradesMechanicalElectricalHomeCompetencySeed,
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
