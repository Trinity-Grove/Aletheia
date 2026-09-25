import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #253 seed data: "Transmissão do Texto Bíblico e Formação do
// Cânon" ---
//
// This is the part of issue #177's original scope (Seção 9 e 11 of the
// #95 checklist) that does NOT depend on commercial translation
// licensing: canon formation history, manuscript transmission, critical
// editions awareness, and the doctrinal-implications explanation for
// the three best-known New Testament textual variant passages. The
// side-by-side translation comparator and any display of critical
// Greek/Hebrew text remain blocked under #177, unchanged.
//
// Same licensing discipline as
// biblical-formation-original-languages-literacy.seed-data.ts (PR
// #172): every competency below describes historical/academic
// knowledge a learner should be able to articulate -- it never embeds,
// quotes, or reproduces any biblical translation text, critical Greek
// text, or lexicon entry. The named historical facts referenced below
// are public-domain/encyclopedic-level facts about manuscripts and
// publications, not the texts themselves:
//  - Septuagint (LXX): Greek translation of the Hebrew Bible, produced
//    ~3rd-2nd century BC -- referenced only by name and date, no text
//    reproduced.
//  - Masoretic Text: the standardized Hebrew Old Testament text
//    tradition (Masoretes, 7th-10th century AD) -- referenced by name
//    only.
//  - Dead Sea Scrolls: manuscripts discovered at Qumran starting 1947 --
//    referenced by name/date only.
//  - Textus Receptus (1516) and Majority/Byzantine Text: referenced by
//    name only, same public-domain status already documented in
//    biblical-formation-original-languages-literacy.seed-data.ts.
//  - Nestle-Aland and UBS (United Bible Societies) critical editions:
//    referenced only as named, copyrighted publications of the Deutsche
//    Bibelgesellschaft -- competencies explain what they ARE and why
//    they're used, never reproduce their text (consistent with that
//    same file's explicit note that these editions are NOT public
//    domain and are never a usable source for embedded content).
//  - The three variant passages (Mark 16:9-20, John 7:53-8:11, 1 John
//    5:7-8) are referenced only by verse citation and by the
//    historical/doctrinal facts surrounding their manuscript support --
//    no translation's wording of any of the three is reproduced.
//
// Canon formation is worded purely historically/descriptively
// (councils, criteria communities used) without taking a position on
// denominational canon disputes (e.g. the deuterocanonical/apocryphal
// books), consistent with this domain's own description: "Formação
// Bíblica" is interdenominational and represents no single tradition's
// position (see TheologicalPositionDefinition for that).
//
// Reuses the existing FAITH.BIBLICAL_FORMATION domain (PR #131) as a
// sibling LearningPath to ORIGINAL_LANGUAGES_LITERACY -- same pattern,
// same defensive/idempotent domain handling in the seeder.

const DOMAIN_CODE = 'FAITH.BIBLICAL_FORMATION';
const PATH_CODE = 'FAITH.BIBLICAL_FORMATION.TEXT_TRANSMISSION_AND_CANON';

export interface TextTransmissionDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface TextTransmissionPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface TextTransmissionCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TextTransmissionSeedData {
  domain: TextTransmissionDomainSeed;
  path: TextTransmissionPathSeed;
  competencies: TextTransmissionCompetencySeed[];
}

export function buildTextTransmissionSeedData(): TextTransmissionSeedData {
  return {
    // Identical to biblical-formation.seed-data.ts's domain seed --
    // reused here only as a defensive fallback in case this seeder runs
    // before every other biblical-formation seeder on a fresh database
    // (same pattern as
    // biblical-formation-original-languages-literacy.seed-data.ts).
    domain: {
      code: DOMAIN_CODE,
      name: 'Formação Bíblica',
      description:
        'Alfabetização bíblica em nível narrativo e histórico -- conhecer as Escrituras como texto e história compartilhada antes de qualquer aprofundamento doutrinário ou denominacional. Interdenominacional por natureza: não representa a posição de nenhuma tradição teológica específica (ver TheologicalPositionDefinition para isso).',
    },
    path: {
      code: PATH_CODE,
      name: 'Transmissão do Texto Bíblico e Formação do Cânon',
      description:
        'A parte do escopo do Comparador Bíblico (issue #177) que não depende de licenciamento comercial: história da formação do cânon, principais famílias e tradições manuscritas, o que são as edições críticas modernas, e as três passagens de variante textual mais conhecidas do Novo Testamento -- tudo em nível histórico/descritivo, sem reproduzir nenhum trecho de texto bíblico ou de edição crítica protegida por direitos autorais.',
    },
    competencies: [
      {
        code: 'FAITH.BIBLICAL_FORMATION.TEXT_TRANSMISSION_AND_CANON.CANON_FORMATION_HISTORY',
        title: 'História da Formação do Cânon Bíblico',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Explicar, de forma histórica e descritiva, os critérios usados pelas comunidades de fé para reconhecer um livro como Escritura: autoria apostólica, uso litúrgico contínuo e consistência doutrinária',
          'Citar o Concílio de Cartago (397 d.C.) como marco do cânon do Novo Testamento no Ocidente cristão, e os debates rabínicos tradicionalmente associados a Jâmnia (final do séc. I d.C.) para o cânon hebraico',
          'Descrever, sem tomar posição, a existência de disputas denominacionais específicas de cânon (ex.: livros deuterocanônicos/apócrifos) como um fato histórico, não uma questão a ser resolvida aqui',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.TEXT_TRANSMISSION_AND_CANON.MANUSCRIPT_FAMILIES_AWARENESS',
        title: 'Famílias e Tradições Manuscritas do Texto Bíblico',
        level: 2,
        ageRecommendation: { min: 14, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Descrever a Septuaginta (tradução grega do Antigo Testamento, séc. III-II a.C.) e o Texto Massorético (texto hebraico padronizado pelos massoretas, séc. VII-X d.C.), sem reproduzir nenhum trecho de texto bíblico',
          'Descrever os Manuscritos do Mar Morto (descobertos em Qumran a partir de 1947) e sua importância para o estudo do Antigo Testamento',
          'Descrever o Textus Receptus (compilação grega de Erasmo, 1516) e o Texto Majoritário/Bizantino como tradições manuscritas do Novo Testamento',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.TEXT_TRANSMISSION_AND_CANON.CRITICAL_EDITIONS_AWARENESS',
        title: 'O que são as Edições Críticas Modernas',
        level: 2,
        ageRecommendation: { min: 15, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Explicar o que são as edições críticas do Novo Testamento grego -- Nestle-Aland e a edição da United Bible Societies (UBS) -- como resultado da comparação sistemática de milhares de manuscritos',
          'Identificar quem publica essas edições (Deutsche Bibelgesellschaft) e por que a maioria das traduções bíblicas modernas as usa como base para o Novo Testamento',
          'Explicar esse processo sem reproduzir nenhum trecho do texto crítico em si, que é protegido por direitos autorais',
        ],
      },
      {
        code: 'FAITH.BIBLICAL_FORMATION.TEXT_TRANSMISSION_AND_CANON.KNOWN_TEXTUAL_VARIANTS_DOCTRINAL_IMPLICATIONS',
        title: 'Variantes Textuais Conhecidas e suas Implicações Doutrinárias',
        level: 3,
        ageRecommendation: { min: 15, max: 18 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Para o final longo de Marcos (Marcos 16:9-20): explicar quais famílias de manuscritos antigos o apresentam ou não, e discutir a implicação doutrinária dos sinais que o acompanham, citando apenas a referência de versículo',
          'Para a perícope da mulher adúltera (João 7:53-8:11): explicar o suporte manuscrito da passagem e sua relação com o ensino sobre graça e julgamento, citando apenas a referência de versículo',
          'Para o Comma Johanneum (1 João 5:7-8): explicar o suporte manuscrito da passagem e seu uso em debates sobre a doutrina trinitária, citando apenas a referência de versículo',
          'Explicar, de forma geral, por que Bíblias impressas modernas costumam trazer notas de rodapé sobre variantes textuais como essas três, sem reproduzir o texto de nenhuma tradução',
        ],
      },
    ],
  };
}

// Builder below parses every row through the exact same Zod schema the
// admin API's ZodValidationPipe applies (same discipline as
// biblical-formation-original-languages-literacy.seed-data.ts).
// domainId isn't knowable until the (already-existing) domain row is
// looked up, so it's injected here rather than baked into the seed data
// above.

export function buildTextTransmissionDomainDto(
  seed: TextTransmissionDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildTextTransmissionPathDto(
  seed: TextTransmissionPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildTextTransmissionCompetencyDto(
  seed: TextTransmissionCompetencySeed,
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
