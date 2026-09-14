import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 5 seed data: "Formação Bíblica" (nível introdutório) ---
//
// First real content slice for the Domain -> Path -> Competency hierarchy
// (issue #96 Fase 0) that isn't a migration of pre-existing hardcoded
// content -- unlike PedagogicalModelDefinitionSeeder (which replays
// CurriculumTemplateEngine's old switch-case content) or
// EvidenceTypeDefinitionSeeder, this is genuinely new, more granular
// catalog data: ten separate CompetencyDefinition rows where the old
// engine only ever had two coarse Subject-level stubs
// ("Fundamentos da Fé Cristã" / "Estudo das Escrituras" in
// curriculum-template.engine.ts's FAITH_AND_THEOLOGY_SUBJECTS). Both can
// coexist: the old Subject-level content still drives applyTemplate's
// legacy plan; this is the new competency-trackable content a family can
// activate via LearnerCompetencyTracking (issue #126 item 3) once a
// CurriculumDefinition bundles it.
//
// Scope is deliberately narrow, per issue #95 section 5's own
// "progressão" principle: only the introductory tier (children /
// PRIMARY_GRAMMAR-ish ages), and only the topics explicitly called out for
// this slice -- narrativas bíblicas, personagens bíblicos, panorama da
// Bíblia, Antigo Testamento, Novo Testamento, vida de Jesus, Atos e Igreja
// Primitiva, salmos e sabedoria, oração, aplicação prática. Section 5 also
// lists "Introdução às cartas", "Memorização de textos" and "Devocionais"
// -- explicitly left for a later slice so this one stays small and
// reviewable, per the task's own instruction.
//
// Anti-bias framing (issue #96's interdenominational principle, and #95
// section 4's "a plataforma evita apresentar determinada tradição
// denominacional como única posição cristã possível"): every objective
// below is narrative/historical/literacy-level -- reciting, mapping,
// timelining, retelling, memorizing a text, journaling a practice -- never
// a doctrinal position statement. Predestination, millennial views,
// sacramental theology, etc. are explicitly out of scope here; that's what
// TheologicalPositionDefinition (issue #96 Fase 3) is for, as a *separate*
// concept from this Bible-literacy content.

const DOMAIN_CODE = 'FAITH.BIBLICAL_FORMATION';
const PATH_CODE = 'FAITH.BIBLICAL_FORMATION.INTRODUCTORY';

export interface BiblicalFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface BiblicalFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface BiblicalFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface BiblicalFormationSeedData {
  domain: BiblicalFormationDomainSeed;
  path: BiblicalFormationPathSeed;
  competencies: BiblicalFormationCompetencySeed[];
}

export function buildBiblicalFormationSeedData(): BiblicalFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Formação Bíblica',
      description:
        'Alfabetização bíblica em nível narrativo e histórico -- conhecer as Escrituras como texto e história compartilhada antes de qualquer aprofundamento doutrinário ou denominacional. Interdenominacional por natureza: não representa a posição de nenhuma tradição teológica específica (ver TheologicalPositionDefinition para isso).',
    },
    path: {
      code: PATH_CODE,
      name: 'Trilha Introdutória de Formação Bíblica',
      description:
        'Nível introdutório da Formação Bíblica, apropriado para crianças e o início da jornada de alfabetização bíblica -- narrativa e panorama, não estudo teológico propriamente dito (isso é para adolescentes/avançados, conforme a progressão descrita na issue #95).',
    },
    competencies: [
      {
        code: 'FAITH.BIBLICAL_FORMATION.NARRATIVES',
        title: 'Narrativas Bíblicas',
        level: 1,
        ageRecommendation: { min: 6, max: 11 },
        evidenceTypes: ['text', 'video', 'photo'],
        starterObjectives: [
          'Recontar oralmente ou por escrito pelo menos três narrativas bíblicas centrais (ex.: Criação, Êxodo, Páscoa), com começo, meio e fim',
          'Ilustrar ou dramatizar uma narrativa bíblica marcante, identificando os personagens principais',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.CHARACTERS',
        title: 'Personagens Bíblicos',
        level: 1,
        ageRecommendation: { min: 6, max: 11 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Descrever a trajetória de pelo menos cinco personagens bíblicos centrais (ex.: Abraão, Moisés, Davi, Ester, Pedro), citando uma lição de vida de cada um',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.OVERVIEW',
        title: 'Panorama da Bíblia',
        level: 1,
        ageRecommendation: { min: 7, max: 11 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Montar uma linha do tempo simples com as grandes divisões da Bíblia (Lei, História, Poesia, Profetas, Evangelhos, Cartas, Apocalipse)',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.OLD_TESTAMENT',
        title: 'Antigo Testamento',
        level: 1,
        ageRecommendation: { min: 7, max: 11 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Identificar as principais divisões do Antigo Testamento (Pentateuco, Históricos, Poéticos, Proféticos) e nomear ao menos um livro de cada',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.NEW_TESTAMENT',
        title: 'Novo Testamento',
        level: 1,
        ageRecommendation: { min: 7, max: 11 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Identificar as principais divisões do Novo Testamento (Evangelhos, Atos, Cartas, Apocalipse) e nomear ao menos um livro de cada',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.LIFE_OF_JESUS',
        title: 'Vida de Jesus',
        level: 1,
        ageRecommendation: { min: 6, max: 11 },
        evidenceTypes: ['text', 'video'],
        starterObjectives: [
          'Recontar em ordem cronológica os principais marcos da vida de Jesus (nascimento, ministério, milagres, ensino, morte e ressurreição)',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ACTS',
        title: 'Atos e Igreja Primitiva',
        level: 1,
        ageRecommendation: { min: 8, max: 11 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Descrever como a igreja começou e se espalhou no livro de Atos, identificando pelo menos dois eventos-chave (ex.: Pentecostes, conversão de Paulo)',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.PSALMS_WISDOM',
        title: 'Salmos e Sabedoria Bíblica',
        level: 1,
        ageRecommendation: { min: 6, max: 11 },
        evidenceTypes: ['audio', 'video', 'text'],
        starterObjectives: [
          'Memorizar e recitar um Salmo ou provérbio à escolha, explicando com as próprias palavras o que ele ensina',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.PRAYER',
        title: 'Oração',
        level: 1,
        ageRecommendation: { min: 6, max: 11 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Manter um registro pessoal de orações por pelo menos duas semanas, incluindo pedidos e agradecimentos',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.APPLICATION',
        title: 'Aplicação Prática',
        level: 1,
        ageRecommendation: { min: 6, max: 11 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Identificar uma situação do dia a dia em que um princípio bíblico estudado poderia ser aplicado, e registrar a reflexão em portfólio',
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

export function buildBiblicalFormationDomainDto(seed: BiblicalFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildBiblicalFormationPathDto(
  seed: BiblicalFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildBiblicalFormationCompetencyDto(
  seed: BiblicalFormationCompetencySeed,
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
