import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 13 seed data: "Música e Cristianismo" (one
// LearningPath, six competencies, branching off the existing
// "Musicalização" domain) ---
//
// The `MUSIC` LearningDomain and its instrument-agnostic foundational
// LearningPath (`MUSIC.FOUNDATIONS`, PR #132) already exist. This is the
// second and final sibling slice PR #132's own seed-data comment flagged
// as future work (the first being MUSIC.PIANO/.../MUSIC.ORCHESTRA,
// "Instrumentos"): a single new LearningPath, `MUSIC.CHRISTIAN_MUSIC`,
// covering the six items in issue #95 section 13's "Música e
// Cristianismo" subsection: hinologia, música sacra, salmos, música
// congregacional, história da música cristã, participação musical
// comunitária.
//
// Issue #95 itself marks this subsection "(opcional, sem restringir a
// música exclusivamente ao repertório religioso)" -- it is content a
// family CAN choose, not content that redefines what music education
// means (that's still MUSIC.FOUNDATIONS + the nine instrument paths).
//
// CRITICAL neutrality constraint, same anti-bias reasoning as
// biblical-formation.seed-data.ts (PR #131) and music-formation's own
// exclusion of this exact subsection (PR #132): this content must stay
// interdenominational and historical/descriptive, NEVER a doctrinal
// position statement or a specific worship-style endorsement. Concretely:
//   - "Hinologia" and "Música Sacra" describe the study, structure and
//     history of hymn/sacred-music forms (meter, textual themes, notable
//     hymn-writing eras) -- never "hinos são superiores a louvor
//     contemporâneo" or the reverse; that is a family's own worship
//     preference (TheologicalPositionDefinition's job), not this seed's.
//   - "Salmos" is framed as musical/poetic form (parallelism, musical
//     settings across traditions and centuries) -- not as exegesis or a
//     specific theological reading (BiblicalFormationSeeder's job).
//   - "Música Congregacional" and "Participação Musical Comunitária"
//     describe the practice of music-making within a worshipping
//     community in general (roles, coordination, service to the group)
//     -- without naming or favoring any denomination, worship style
//     (traditional vs. contemporary), or liturgical tradition.
//   - "História da Música Cristã" surveys the broad historical arc
///    (chant, hymnody, congregational song across centuries and
//     traditions) at a survey level -- not a denominational history and
//     not an evaluation of which tradition or era is more faithful.
// An integration test scans every seeded string for doctrinal-position
// and denominational terms and asserts none appear, mirroring PR #131's
// own technique.

const DOMAIN_CODE = 'MUSIC';
const PATH_CODE = 'MUSIC.CHRISTIAN_MUSIC';

export interface MusicChristianDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface MusicChristianPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface MusicChristianCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface MusicChristianSeedData {
  domain: MusicChristianDomainSeed;
  path: MusicChristianPathSeed;
  competencies: MusicChristianCompetencySeed[];
}

export function buildMusicChristianSeedData(): MusicChristianSeedData {
  return {
    // Identical to music-formation.seed-data.ts's domain seed -- reused
    // here only as a defensive fallback in case this seeder runs before
    // MusicFormationSeeder on a fresh database. Whichever seeder runs
    // first creates the domain; the other finds it already present and
    // is a no-op for the domain step.
    domain: {
      code: DOMAIN_CODE,
      name: 'Musicalização',
      description:
        'Formação musical como disciplina própria, não uma "atividade extracurricular" -- alfabetização musical (ritmo, ouvido, leitura, teoria) que serve de base para qualquer instrumento ou voz que o aluno venha a escolher depois. Não pressupõe posse de um instrumento específico nem uma tradição musical religiosa particular (ver Instrumentos e Música e Cristianismo como trilhas futuras e separadas).',
    },
    path: {
      code: PATH_CODE,
      name: 'Música e Cristianismo',
      description:
        'Trilha opcional cobrindo a intersecção entre música e fé cristã em nível histórico e descritivo -- hinologia, música sacra, os Salmos como forma musical/poética, música congregacional e participação musical comunitária -- sem restringir a música exclusivamente ao repertório religioso e sem assumir uma tradição denominacional, estilo de adoração ou posição doutrinária específica como a única válida (issue #95 seção 13, subseção "Música e Cristianismo").',
    },
    competencies: [
      {
        code: 'MUSIC.CHRISTIAN_MUSIC.HYMNOLOGY',
        title: 'Hinologia',
        level: 1,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['text', 'audio'],
        starterObjectives: [
          'Explicar o que é um hino, identificando sua estrutura básica (métrica, estrofes, refrão quando houver) em pelo menos dois exemplos de tradições ou épocas diferentes',
          'Pesquisar e apresentar a origem histórica de um hino específico, incluindo período aproximado de composição e contexto em que foi escrito',
        ],
      },
      {
        code: 'MUSIC.CHRISTIAN_MUSIC.SACRED_MUSIC',
        title: 'Música Sacra',
        level: 1,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['text', 'audio'],
        starterObjectives: [
          'Reconhecer de ouvido características musicais comuns à música sacra (ex.: uso de coral, órgão, canto responsorial) em exemplos de diferentes períodos históricos',
        ],
      },
      {
        code: 'MUSIC.CHRISTIAN_MUSIC.PSALMS_AS_MUSIC',
        title: 'Salmos como Forma Musical e Poética',
        level: 1,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['text', 'audio'],
        starterObjectives: [
          'Identificar o paralelismo poético típico dos Salmos como forma literária e descrever como diferentes tradições musicais já musicaram Salmos ao longo da história',
        ],
      },
      {
        code: 'MUSIC.CHRISTIAN_MUSIC.CONGREGATIONAL_MUSIC',
        title: 'Música Congregacional',
        level: 1,
        ageRecommendation: { min: 9, max: 15 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Descrever o papel da música cantada em conjunto por uma comunidade (função de unir o grupo, participação de todos, coordenação entre quem conduz e quem acompanha), sem restringir a explicação a uma única tradição ou estilo',
        ],
      },
      {
        code: 'MUSIC.CHRISTIAN_MUSIC.HISTORY',
        title: 'História da Música Cristã',
        level: 1,
        ageRecommendation: { min: 10, max: 15 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Pesquisar e apresentar, em linhas gerais, como a música associada à fé cristã mudou ao longo de pelo menos três períodos históricos diferentes, citando exemplos de cada período',
        ],
      },
      {
        code: 'MUSIC.CHRISTIAN_MUSIC.COMMUNITY_PARTICIPATION',
        title: 'Participação Musical Comunitária',
        level: 1,
        ageRecommendation: { min: 8, max: 15 },
        evidenceTypes: ['video', 'observation', 'text'],
        starterObjectives: [
          'Participar de uma atividade musical em grupo (ensaio, apresentação ou momento de música compartilhada) e registrar em texto o que foi sua contribuição e o que aprendeu sobre tocar ou cantar junto com outras pessoas',
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
// above. progressionAxis/educationalStages metadata is derived
// automatically by createCompetencyDefinitionSchema's transform
// (packages/contracts/src/curriculum-definitions.ts, PR #154) from the
// code and ageRecommendation -- none of these codes contain an
// EDUCATIONAL_STAGE path segment, so every competency here resolves to
// `progressionAxis: 'DOMAIN_PROFICIENCY'`, matching
// docs/architecture/universal-educational-taxonomy.md's guidance that
// Música uses DOMAIN_PROFICIENCY.

export function buildMusicChristianDomainDto(seed: MusicChristianDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildMusicChristianPathDto(
  seed: MusicChristianPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildMusicChristianCompetencyDto(
  seed: MusicChristianCompetencySeed,
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
