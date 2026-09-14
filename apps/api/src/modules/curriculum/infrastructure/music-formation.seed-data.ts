import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 13 seed data: "Musicalização" (fundamentos, agnósticos de instrumento) ---
//
// Same pattern as biblical-formation.seed-data.ts (issue #95 section 5,
// PR #131): a new, richer Domain -> Path -> Competency slice, not a
// migration of pre-existing hardcoded content. The pre-existing
// "Musicalização e Artes" subject in curriculum-template.engine.ts's
// ARTS_TRADES_VOCATION_SUBJECTS is broader (music AND visual arts AND
// theater combined into one Subject stub with two generic starter
// objectives) and still drives applyTemplate's legacy plan -- both
// coexist. This domain is scoped tighter and deeper: music only, ten
// separately trackable competencies instead of one catch-all stub.
//
// Scope is deliberately limited to section 13's "Fundamentos" -- the
// instrument-agnostic musical literacy every musician needs regardless of
// which instrument (or voice) they eventually specialize in: ritmo,
// pulsação, percepção auditiva, afinação, canto, leitura musical,
// partitura, teoria musical, harmonia, história da música. Two other
// subsections of section 13 are explicitly NOT covered here, per the
// task's own instruction:
//   - "Instrumentos" (piano, violão, bateria, etc.) -- naturally a set of
//     separate, per-instrument LearningPaths branching off this same
//     foundational domain once it exists; that's its own follow-up slice,
//     not squeezed into this one.
//   - "Música e cristianismo" (hinologia, música sacra, etc.) -- kept out
//     so this slice stays universal/instrument-and-tradition-agnostic,
//     matching the same anti-bias reasoning as biblical-formation.seed-data.ts
//     (a specific worship-music tradition is not the same as universal
//     musical literacy).
//
// Age-appropriate framing: every objective below is achievable with body
// percussion, voice, or a shared/borrowed simple instrument -- nothing
// assumes the learner already owns or plays a specific instrument.

const DOMAIN_CODE = 'MUSIC';
const PATH_CODE = 'MUSIC.FOUNDATIONS';

export interface MusicFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface MusicFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface MusicFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface MusicFormationSeedData {
  domain: MusicFormationDomainSeed;
  path: MusicFormationPathSeed;
  competencies: MusicFormationCompetencySeed[];
}

export function buildMusicFormationSeedData(): MusicFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Musicalização',
      description:
        'Formação musical como disciplina própria, não uma "atividade extracurricular" -- alfabetização musical (ritmo, ouvido, leitura, teoria) que serve de base para qualquer instrumento ou voz que o aluno venha a escolher depois. Não pressupõe posse de um instrumento específico nem uma tradição musical religiosa particular (ver Instrumentos e Música e Cristianismo como trilhas futuras e separadas).',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos da Musicalização',
      description:
        'Trilha fundamental e agnóstica de instrumento -- os alicerces que todo músico precisa (ritmo, pulsação, ouvido, afinação, canto, leitura, teoria, harmonia, história) antes de se especializar em um instrumento específico (issue #95 seção 13, subseção "Fundamentos").',
    },
    competencies: [
      {
        code: 'MUSIC.FOUNDATIONS.RHYTHM',
        title: 'Ritmo',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['audio', 'video'],
        starterObjectives: [
          'Reproduzir um padrão rítmico simples (palmas, percussão corporal ou instrumento de percussão) copiando um modelo ouvido',
          'Criar e registrar em áudio ou vídeo um padrão rítmico próprio de pelo menos quatro compassos',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.PULSE',
        title: 'Pulsação',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['audio', 'video', 'observation'],
        starterObjectives: [
          'Manter uma pulsação constante acompanhando uma música por pelo menos um minuto, sem acelerar ou desacelerar',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.EAR_TRAINING',
        title: 'Percepção Auditiva',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['audio', 'observation'],
        starterObjectives: [
          'Identificar de ouvido se um som é mais agudo ou mais grave, e se duas notas tocadas são iguais ou diferentes',
          'Reconhecer de ouvido uma melodia simples conhecida e cantarolar ou reproduzir seu contorno melódico',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.PITCH',
        title: 'Afinação',
        level: 1,
        ageRecommendation: { min: 7, max: 12 },
        evidenceTypes: ['audio'],
        starterObjectives: [
          'Cantar ou tocar uma nota afinada, comparando o resultado com uma referência (diapasão, afinador digital ou instrumento)',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.SINGING',
        title: 'Canto',
        level: 1,
        ageRecommendation: { min: 6, max: 12 },
        evidenceTypes: ['audio', 'video'],
        starterObjectives: [
          'Cantar uma canção simples do início ao fim, mantendo afinação e ritmo, registrada em áudio ou vídeo para o portfólio',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.MUSIC_READING',
        title: 'Leitura Musical',
        level: 1,
        ageRecommendation: { min: 7, max: 12 },
        evidenceTypes: ['audio', 'video', 'photo'],
        starterObjectives: [
          'Ler e executar (cantando ou tocando) uma melodia curta a partir de uma notação musical simples (cifra, notas ou solfejo)',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.NOTATION',
        title: 'Partitura',
        level: 1,
        ageRecommendation: { min: 7, max: 12 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Identificar em uma partitura os elementos básicos: pauta, clave, notas, figuras de tempo e compasso',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.THEORY',
        title: 'Teoria Musical',
        level: 1,
        ageRecommendation: { min: 8, max: 12 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Explicar com as próprias palavras o que são escala, tom e semitom, dando um exemplo de cada',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.HARMONY',
        title: 'Harmonia',
        level: 1,
        ageRecommendation: { min: 8, max: 12 },
        evidenceTypes: ['audio', 'text'],
        starterObjectives: [
          'Reconhecer de ouvido a diferença entre um acorde maior e um acorde menor, descrevendo a diferença de sensação entre eles',
        ],
      },
      {
        code: 'MUSIC.FOUNDATIONS.HISTORY',
        title: 'História da Música',
        level: 1,
        ageRecommendation: { min: 8, max: 12 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Pesquisar e apresentar (oralmente ou por escrito) um período ou compositor da história da música, citando pelo menos três fatos relevantes',
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

export function buildMusicFormationDomainDto(seed: MusicFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildMusicFormationPathDto(
  seed: MusicFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildMusicFormationCompetencyDto(
  seed: MusicFormationCompetencySeed,
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
