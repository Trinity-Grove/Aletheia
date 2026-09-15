import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #96 section 17 seed data: "Texto original / manuscritos" (introductory literacy only) ---
//
// Issue #96 section 17 describes a full `BiblicalTextSource` roadmap
// feature (Hebrew text, Greek text, Septuagint, Textus Receptus, critical
// editions, a structured textual-variant/apparatus system) -- the epic
// itself labels this "roadmap avançado", P2, explicitly not immediate
// scope ("não como spec de implementação imediata"). This seed does NOT
// build that feature. It builds only the narrow, safely-scoped slice
// this task called for: introductory-literacy competencies about
// original-language awareness -- alphabet recognition, what Strong's
// numbering is and how a lookup works, what a manuscript tradition is,
// and awareness that translations differ and why.
//
// Licensing research (documented here per this task's own requirement to
// cite sources and verify status before using any of it):
//  - No competency below embeds, quotes, or reproduces any biblical
//    text, lexicon entry, or manuscript excerpt at all -- consistent
//    with this project's standing rule (PR #122) that scriptural text is
//    never persisted, only fetched live from the YouVersion API when
//    needed. Objectives describe *skills and awareness*, not content, so
//    the licensing status of any particular Greek/Hebrew text edition is
//    not actually load-bearing for what's seeded here.
//  - Named historical facts referenced *by name only* (as descriptive,
//    encyclopedic-level historical knowledge a learner should be aware
//    of, never as embedded source text):
//    - Strong's numbering/concordance system: James Strong, first
//      published 1890 -- in the public domain (19th-century US
//      publication).
//    - Textus Receptus: the Erasmus Greek NT compilation tradition,
//      published from 1516 -- in the public domain.
//    - Westminster Leningrad Codex (WLC): the standard Hebrew Old
//      Testament source text, explicitly released to the public domain
//      by the J. Alan Groves Center for Advanced Biblical Research
//      (formerly Westminster Hebrew Institute).
//  - Deliberately NOT used or referenced as a usable source for any
//    future feature building on this seed: SBL Greek New Testament
//    (SBLGNT) -- copyrighted by SBL/Logos with a restrictive usage
//    license, not public domain; Nestle-Aland/UBS critical editions --
//    copyrighted by Deutsche Bibelgesellschaft, not public domain; BDAG,
//    HALOT and other modern academic lexicons -- copyrighted, not public
//    domain. None of these are needed here since no text is embedded,
//    but are called out explicitly so a future "Comparador Bíblico" /
//    full BiblicalTextSource effort inherits this research instead of
//    re-deriving it (see the comment left on issue #96 for the same
//    note in a more visible place).
//
// Scope boundary vs. biblical-formation-intermediate.seed-data.ts: that
// path teaches hermeneutics/doctrine-survey/church-history skills; this
// path teaches original-language *awareness* skills. Neither performs
// actual exegesis in Greek or Hebrew -- that remains seminary-tier
// (issue #95 section 6), out of scope for both.

const DOMAIN_CODE = 'FAITH.BIBLICAL_FORMATION';
const PATH_CODE = 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY';

export interface OriginalLanguagesLiteracyDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface OriginalLanguagesLiteracyPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface OriginalLanguagesLiteracyCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface OriginalLanguagesLiteracySeedData {
  domain: OriginalLanguagesLiteracyDomainSeed;
  path: OriginalLanguagesLiteracyPathSeed;
  competencies: OriginalLanguagesLiteracyCompetencySeed[];
}

export function buildOriginalLanguagesLiteracySeedData(): OriginalLanguagesLiteracySeedData {
  return {
    // Identical to biblical-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // BiblicalFormationSeeder. Whichever runs first creates the domain;
    // the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Formação Bíblica',
      description:
        'Alfabetização bíblica em nível narrativo e histórico -- conhecer as Escrituras como texto e história compartilhada antes de qualquer aprofundamento doutrinário ou denominacional. Interdenominacional por natureza: não representa a posição de nenhuma tradição teológica específica (ver TheologicalPositionDefinition para isso).',
    },
    path: {
      code: PATH_CODE,
      name: 'Alfabetização em Idiomas Originais',
      description:
        'Introdução ao texto bíblico original (issue #96 seção 17), em nível de alfabetização e consciência histórica -- reconhecer os alfabetos grego e hebraico, entender o que é o sistema de numeração Strong, o que é uma tradição manuscrita, e por que as traduções diferem. Não é exegese em idiomas originais nem um léxico/interlinear completo (isso é um recurso de produto, fora de escopo aqui) -- e nenhuma competência exige ou embute texto bíblico em si, respeitando a regra do projeto de nunca persistir texto das Escrituras diretamente (buscado ao vivo via API da YouVersion quando necessário).',
    },
    competencies: [
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.GREEK_ALPHABET',
        title: 'Alfabeto Grego',
        level: 2,
        ageRecommendation: { min: 12, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Reconhecer e nomear as 24 letras do alfabeto grego (maiúsculas e minúsculas), sem necessidade de ler ou traduzir palavras gregas completas',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.HEBREW_ALPHABET',
        title: 'Alfabeto Hebraico',
        level: 2,
        ageRecommendation: { min: 12, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Reconhecer e nomear as 22 consoantes do alfabeto hebraico e explicar que o hebraico é escrito da direita para a esquerda, sem necessidade de ler ou traduzir palavras hebraicas completas',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.STRONGS_SYSTEM_AWARENESS',
        title: 'Sistema de Numeração Strong',
        level: 2,
        ageRecommendation: { min: 12, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Explicar o que é o sistema de numeração de Strong (concordância de James Strong, século XIX, de domínio público) e demonstrar como localizar o número Strong correspondente a uma palavra usando uma ferramenta de consulta',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.MANUSCRIPT_TRADITION_AWARENESS',
        title: 'O que é uma Tradição Manuscrita',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Explicar o que é uma tradição manuscrita bíblica (cópias feitas ao longo de séculos antes da impressão) e nomear pelo menos duas tradições historicamente relevantes (ex.: Textus Receptus, Texto Massorético), de forma puramente descritiva e histórica',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.TRANSLATION_PHILOSOPHY_AWARENESS',
        title: 'Por que as Traduções Bíblicas Diferem',
        level: 2,
        ageRecommendation: { min: 12, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Comparar duas filosofias de tradução (ex.: equivalência formal e equivalência dinâmica) e explicar, com um exemplo hipotético, por que elas podem produzir textos diferentes a partir do mesmo original',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.TEXTUAL_CRITICISM_AWARENESS',
        title: 'Introdução à Crítica Textual',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Explicar o que é a crítica textual como disciplina acadêmica (comparar cópias manuscritas para reconstruir o texto original) e por que variantes textuais existem, sem discutir nenhuma passagem específica em profundidade',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.ORIGINAL_LANGUAGES_LITERACY.LEXICON_TOOL_LITERACY',
        title: 'Uso Básico de Léxico e Concordância',
        level: 2,
        ageRecommendation: { min: 13, max: 18 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Usar uma ferramenta de léxico ou concordância bíblica para localizar o significado geral de uma palavra a partir do seu número Strong, registrando o processo passo a passo (não o conteúdo do léxico em si)',
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

export function buildOriginalLanguagesLiteracyDomainDto(
  seed: OriginalLanguagesLiteracyDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildOriginalLanguagesLiteracyPathDto(
  seed: OriginalLanguagesLiteracyPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildOriginalLanguagesLiteracyCompetencyDto(
  seed: OriginalLanguagesLiteracyCompetencySeed,
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
