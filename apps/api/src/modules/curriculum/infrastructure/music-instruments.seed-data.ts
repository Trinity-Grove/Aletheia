import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 13 seed data: "Instrumentos" (9 per-instrument
// LearningPaths branching off the existing "Musicalização" domain) ---
//
// The `MUSIC` LearningDomain and its instrument-agnostic foundational
// LearningPath (`MUSIC.FOUNDATIONS`, PR #132: ritmo, pulsação, percepção
// auditiva, afinação, canto, leitura musical, partitura, teoria musical,
// harmonia, história da música) already exist. This slice does not
// change or duplicate that foundation -- it adds nine new,
// instrument-specific LearningPaths under the SAME domain, exactly the
// follow-up PR #132's own seed-data comment flagged as future work.
//
// Mapped from issue #95 section 13's "Instrumentos" checklist (9 items:
// "Instrumento configurável por aluno", Piano/teclado, Violão, Guitarra,
// Contrabaixo, Bateria, Instrumentos de sopro, Cordas, Outros) onto nine
// concrete, teachable LearningPaths. "Instrumento configurável por
// aluno" is a per-student configuration/UX concern, not new catalog
// content, so it is represented implicitly by having nine independent
// paths a family can choose from rather than one monolithic path.
// Violão and Guitarra are combined into one path (same six-string
// plucked/strummed technique family, distinguished mainly by amplifier
// and pickup use, not by beginner fundamentals). Contrabaixo and Cordas
// are covered by the generic MUSIC.ORCHESTRA introductory path rather
// than getting their own dedicated path in this first pass, alongside
// two additions judged pedagogically necessary for this context (Flauta
// Doce -- the standard first classroom instrument in Brazilian music
// education -- and Canto as a dedicated instrument path, distinct from
// the foundational MUSIC.FOUNDATIONS.SINGING competency, which only
// covers universal vocal literacy) and one path splitting acoustic/
// digital-piano technique (Piano/Teclado) from synthesizer-specific
// technique (Teclas Eletrônicas):
//   1. MUSIC.PIANO             -- Piano/Teclado
//   2. MUSIC.GUITAR            -- Violão/Guitarra
//   3. MUSIC.DRUMS             -- Bateria/Percussão
//   4. MUSIC.RECORDER          -- Flauta Doce
//   5. MUSIC.VIOLIN            -- Violino
//   6. MUSIC.VOICE             -- Canto (voz como instrumento)
//   7. MUSIC.ELECTRONIC_KEYS   -- Teclas Eletrônicas
//   8. MUSIC.WINDS             -- Instrumentos de Sopro (introdução geral)
//   9. MUSIC.ORCHESTRA         -- Instrumentos de Orquestra (introdução geral)
//
// Each path assumes MUSIC.FOUNDATIONS competencies as prerequisite
// literacy and does not re-teach them; each carries six competencies of
// its own, following the same beginner-technique / instrument-specific
// reading / practice-habit shape: postura e preparo, leitura específica
// do instrumento, técnica básica, primeira peça completa, rotina de
// prática, e cuidado/manutenção do instrumento (ou cuidado vocal, no
// caso de Canto).
//
// Deliberately excludes "Música e Cristianismo" (hinologia, música
// sacra, etc.) -- that is a separate sibling PR, kept out here so this
// slice stays about instrumental technique regardless of repertoire or
// tradition, matching the same neutrality reasoning as
// music-formation.seed-data.ts.

const DOMAIN_CODE = 'MUSIC';

export interface MusicInstrumentsDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface MusicInstrumentsPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface MusicInstrumentsCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface MusicInstrumentsPathSeedData {
  path: MusicInstrumentsPathSeed;
  competencies: MusicInstrumentsCompetencySeed[];
}

export interface MusicInstrumentsSeedData {
  domain: MusicInstrumentsDomainSeed;
  paths: MusicInstrumentsPathSeedData[];
}

export function buildMusicInstrumentsSeedData(): MusicInstrumentsSeedData {
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
    paths: [
      {
        path: {
          code: 'MUSIC.PIANO',
          name: 'Piano/Teclado',
          description:
            'Técnica inicial de piano ou teclado acústico/digital -- postura, leitura em pauta, escalas e primeira peça -- a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.PIANO.POSTURE',
            title: 'Postura ao Piano',
            level: 1,
            ageRecommendation: { min: 6, max: 12 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Sentar-se ao piano com postura correta (altura do banco, distância do teclado, posicionamento dos pulsos) e demonstrar o formato correto da mão sobre as teclas',
            ],
          },
          {
            code: 'MUSIC.PIANO.NOTE_READING',
            title: 'Leitura de Partitura para Piano',
            level: 1,
            ageRecommendation: { min: 7, max: 12 },
            evidenceTypes: ['video', 'photo'],
            starterObjectives: [
              'Identificar e tocar notas na clave de sol e na clave de fá correspondentes às posições básicas da mão direita e da mão esquerda',
            ],
          },
          {
            code: 'MUSIC.PIANO.SCALES',
            title: 'Escalas e Técnica Básica',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Tocar a escala de dó maior com as duas mãos, separadamente, com dedilhado correto e ritmo constante',
            ],
          },
          {
            code: 'MUSIC.PIANO.FIRST_PIECE',
            title: 'Primeira Peça Completa',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar do início ao fim uma peça simples para piano iniciante, com as duas mãos, mantendo ritmo e notas corretas',
            ],
          },
          {
            code: 'MUSIC.PIANO.PRACTICE_ROUTINE',
            title: 'Rotina de Prática ao Piano',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária ao piano por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.PIANO.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar cuidados básicos com um piano ou teclado (limpeza, ambiente, afinação quando aplicável) e por que eles importam',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.GUITAR',
          name: 'Violão/Guitarra',
          description:
            'Técnica inicial de violão ou guitarra -- postura, leitura de cifra, acordes e primeira música -- a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.GUITAR.POSTURE',
            title: 'Postura ao Violão/Guitarra',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Segurar o instrumento na posição correta (sentado e em pé) e posicionar a mão esquerda no braço do instrumento sem tensão excessiva',
            ],
          },
          {
            code: 'MUSIC.GUITAR.CHORD_READING',
            title: 'Leitura de Cifra e Acordes Básicos',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'photo'],
            starterObjectives: [
              'Ler uma cifra simples e formar corretamente pelo menos quatro acordes básicos (ex.: Dó, Sol, Ré, Mi menor)',
            ],
          },
          {
            code: 'MUSIC.GUITAR.STRUMMING',
            title: 'Técnica de Batida e Dedilhado',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar um padrão de batida ou dedilhado simples mantendo ritmo constante ao trocar entre dois acordes',
            ],
          },
          {
            code: 'MUSIC.GUITAR.FIRST_SONG',
            title: 'Primeira Música Completa',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Tocar do início ao fim uma música simples usando os acordes e a batida já aprendidos',
            ],
          },
          {
            code: 'MUSIC.GUITAR.PRACTICE_ROUTINE',
            title: 'Rotina de Prática ao Violão/Guitarra',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.GUITAR.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Trocar ou afinar as cordas com ajuda de um adulto e explicar cuidados básicos de armazenamento e transporte do instrumento',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.DRUMS',
          name: 'Bateria/Percussão',
          description:
            'Técnica inicial de bateria e percussão -- postura, coordenação, leitura rítmica e primeira peça -- a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.DRUMS.POSTURE',
            title: 'Postura e Empunhadura das Baquetas',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Sentar-se corretamente ao instrumento (ou posicionar-se com percussão portátil) e demonstrar a empunhadura correta das baquetas ou mãos',
            ],
          },
          {
            code: 'MUSIC.DRUMS.COORDINATION',
            title: 'Coordenação Motora Básica',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['video'],
            starterObjectives: [
              'Executar um padrão simples de coordenação entre mãos (ou mãos e pés, quando aplicável) mantendo pulsação constante',
            ],
          },
          {
            code: 'MUSIC.DRUMS.RHYTHM_READING',
            title: 'Leitura Rítmica para Percussão',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'photo'],
            starterObjectives: [
              'Ler e executar um padrão rítmico simples escrito em notação rítmica básica (figuras de tempo)',
            ],
          },
          {
            code: 'MUSIC.DRUMS.FIRST_GROOVE',
            title: 'Primeiro Groove/Peça Completa',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar do início ao fim um groove ou peça de percussão simples, mantendo tempo constante junto a uma música de referência',
            ],
          },
          {
            code: 'MUSIC.DRUMS.PRACTICE_ROUTINE',
            title: 'Rotina de Prática em Percussão',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.DRUMS.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar cuidados básicos com baquetas, peles/instrumentos de percussão e organização do espaço de prática',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.RECORDER',
          name: 'Flauta Doce',
          description:
            'Técnica inicial de flauta doce -- respiração, digitação, leitura e primeira peça -- a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.RECORDER.BREATHING',
            title: 'Respiração e Embocadura',
            level: 1,
            ageRecommendation: { min: 6, max: 11 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Produzir um som limpo e sustentado na flauta doce controlando respiração e embocadura, sem forçar o sopro',
            ],
          },
          {
            code: 'MUSIC.RECORDER.FINGERING',
            title: 'Digitação Básica',
            level: 1,
            ageRecommendation: { min: 6, max: 11 },
            evidenceTypes: ['video', 'photo'],
            starterObjectives: [
              'Executar corretamente a digitação das primeiras cinco a sete notas (ex.: si, lá, sol, fá, mi) com transições limpas entre elas',
            ],
          },
          {
            code: 'MUSIC.RECORDER.NOTE_READING',
            title: 'Leitura de Partitura para Flauta Doce',
            level: 1,
            ageRecommendation: { min: 7, max: 11 },
            evidenceTypes: ['video', 'photo'],
            starterObjectives: [
              'Ler e executar uma melodia curta a partir de uma partitura simples escrita para flauta doce',
            ],
          },
          {
            code: 'MUSIC.RECORDER.FIRST_PIECE',
            title: 'Primeira Peça Completa',
            level: 1,
            ageRecommendation: { min: 6, max: 11 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar do início ao fim uma peça simples para flauta doce, mantendo ritmo e notas corretas',
            ],
          },
          {
            code: 'MUSIC.RECORDER.PRACTICE_ROUTINE',
            title: 'Rotina de Prática com Flauta Doce',
            level: 1,
            ageRecommendation: { min: 6, max: 11 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.RECORDER.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 6, max: 11 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar e demonstrar como limpar e guardar corretamente a flauta doce após o uso',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.VIOLIN',
          name: 'Violino',
          description:
            'Técnica inicial de violino -- postura, arco, digitação e primeira peça -- a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.VIOLIN.POSTURE',
            title: 'Postura e Posicionamento do Instrumento',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Posicionar corretamente o violino sob o queixo/ombro e segurar o arco com a empunhadura correta',
            ],
          },
          {
            code: 'MUSIC.VIOLIN.BOWING',
            title: 'Técnica Básica de Arco',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['video'],
            starterObjectives: [
              'Produzir um som limpo e sustentado nas cordas soltas usando arcadas para cima e para baixo com controle',
            ],
          },
          {
            code: 'MUSIC.VIOLIN.FINGERING',
            title: 'Digitação na Primeira Posição',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'photo'],
            starterObjectives: [
              'Tocar uma escala simples de uma oitava na primeira posição com afinação e digitação corretas',
            ],
          },
          {
            code: 'MUSIC.VIOLIN.FIRST_PIECE',
            title: 'Primeira Peça Completa',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar do início ao fim uma peça simples para violino iniciante, mantendo ritmo e afinação',
            ],
          },
          {
            code: 'MUSIC.VIOLIN.PRACTICE_ROUTINE',
            title: 'Rotina de Prática ao Violino',
            level: 1,
            ageRecommendation: { min: 7, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.VIOLIN.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 6, max: 13 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar cuidados básicos com o violino e o arco (limpeza do breu, tensão das cerdas, armazenamento no estojo)',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.VOICE',
          name: 'Canto (Voz como Instrumento)',
          description:
            'Técnica vocal inicial -- respiração, aquecimento, projeção e interpretação de repertório -- tratando a voz como instrumento a ser tecnicamente desenvolvido, além da competência universal de canto já coberta em MUSIC.FOUNDATIONS.SINGING.',
        },
        competencies: [
          {
            code: 'MUSIC.VOICE.BREATHING',
            title: 'Respiração Diafragmática',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Demonstrar e usar respiração diafragmática ao cantar, sustentando uma nota por vários segundos sem tensão na garganta',
            ],
          },
          {
            code: 'MUSIC.VOICE.WARM_UP',
            title: 'Aquecimento Vocal',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar uma sequência básica de aquecimento vocal antes de cantar, explicando por que cada exercício é importante',
            ],
          },
          {
            code: 'MUSIC.VOICE.PROJECTION',
            title: 'Projeção e Articulação',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Cantar uma frase melódica com projeção adequada e articulação clara das palavras, sem forçar a voz',
            ],
          },
          {
            code: 'MUSIC.VOICE.REPERTOIRE',
            title: 'Interpretação de Repertório',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Interpretar do início ao fim uma música do repertório escolhido, comunicando a intenção da letra além de apenas acertar as notas',
            ],
          },
          {
            code: 'MUSIC.VOICE.PRACTICE_ROUTINE',
            title: 'Rotina de Prática Vocal',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática vocal diária por pelo menos duas semanas seguidas, anotando exercícios feitos e duração',
            ],
          },
          {
            code: 'MUSIC.VOICE.VOCAL_CARE',
            title: 'Cuidado Vocal',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar pelo menos três hábitos de cuidado com a voz (hidratação, evitar forçar a garganta, descanso vocal) e por que cada um importa',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.ELECTRONIC_KEYS',
          name: 'Teclas Eletrônicas',
          description:
            'Técnica inicial em teclados eletrônicos e sintetizadores -- sons, ritmos automáticos, controles e primeira composição simples -- distinta da técnica acústica coberta em MUSIC.PIANO, a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.ELECTRONIC_KEYS.CONTROLS',
            title: 'Controles Básicos do Teclado Eletrônico',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Identificar e usar corretamente os controles básicos de um teclado eletrônico (seleção de som/timbre, volume, ritmos automáticos, metrônomo)',
            ],
          },
          {
            code: 'MUSIC.ELECTRONIC_KEYS.SOUND_SELECTION',
            title: 'Timbres e Sons',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['audio', 'observation'],
            starterObjectives: [
              'Tocar a mesma melodia curta usando pelo menos três timbres diferentes e descrever como o som muda a sensação da música',
            ],
          },
          {
            code: 'MUSIC.ELECTRONIC_KEYS.RHYTHM_ACCOMPANIMENT',
            title: 'Acompanhamento Rítmico Automático',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Tocar uma melodia simples junto com um ritmo automático do teclado, mantendo sincronia entre as duas mãos e a base rítmica',
            ],
          },
          {
            code: 'MUSIC.ELECTRONIC_KEYS.FIRST_ARRANGEMENT',
            title: 'Primeiro Arranjo Simples',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['audio', 'video'],
            starterObjectives: [
              'Montar e executar um arranjo simples de uma música conhecida usando melodia, acompanhamento e ao menos um recurso do teclado (timbre ou ritmo)',
            ],
          },
          {
            code: 'MUSIC.ELECTRONIC_KEYS.PRACTICE_ROUTINE',
            title: 'Rotina de Prática em Teclas Eletrônicas',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.ELECTRONIC_KEYS.INSTRUMENT_CARE',
            title: 'Cuidado com o Equipamento',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar cuidados básicos com um teclado eletrônico (energia, cabos, armazenamento, transporte)',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.WINDS',
          name: 'Instrumentos de Sopro (Introdução Geral)',
          description:
            'Introdução genérica à família dos instrumentos de sopro (madeiras e metais) -- respiração, embocadura e primeiras notas -- para famílias com acesso a um instrumento de sopro específico não coberto por uma trilha dedicada, a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.WINDS.BREATH_SUPPORT',
            title: 'Suporte Respiratório',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Demonstrar controle de respiração adequado para sustentar uma nota longa no instrumento de sopro escolhido, sem tontura ou tensão excessiva',
            ],
          },
          {
            code: 'MUSIC.WINDS.EMBOUCHURE',
            title: 'Embocadura',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Formar e manter uma embocadura correta para o instrumento escolhido, produzindo um som estável e limpo',
            ],
          },
          {
            code: 'MUSIC.WINDS.FIRST_NOTES',
            title: 'Primeiras Notas',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Produzir com afinação correta as primeiras três a cinco notas do instrumento de sopro escolhido',
            ],
          },
          {
            code: 'MUSIC.WINDS.FIRST_PIECE',
            title: 'Primeira Peça Completa',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Executar do início ao fim uma peça simples adequada ao instrumento de sopro escolhido',
            ],
          },
          {
            code: 'MUSIC.WINDS.PRACTICE_ROUTINE',
            title: 'Rotina de Prática em Sopro',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.WINDS.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar e demonstrar a limpeza e manutenção básica esperada para o instrumento de sopro escolhido após o uso',
            ],
          },
        ],
      },
      {
        path: {
          code: 'MUSIC.ORCHESTRA',
          name: 'Instrumentos de Orquestra (Introdução Geral)',
          description:
            'Introdução geral à orquestra -- famílias de instrumentos (cordas, sopros de madeira, metais, percussão), papel de cada uma e experiência de tocar em conjunto -- para instrumentos de orquestra (ex.: contrabaixo, viola, violoncelo) sem trilha dedicada própria, a partir da alfabetização musical de MUSIC.FOUNDATIONS.',
        },
        competencies: [
          {
            code: 'MUSIC.ORCHESTRA.FAMILIES',
            title: 'Famílias de Instrumentos da Orquestra',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['text', 'audio'],
            starterObjectives: [
              'Identificar de ouvido e visualmente as quatro famílias de instrumentos de uma orquestra (cordas, madeiras, metais, percussão) e citar um exemplo de cada',
            ],
          },
          {
            code: 'MUSIC.ORCHESTRA.INSTRUMENT_ROLE',
            title: 'Papel do Instrumento Escolhido',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar o papel do instrumento de orquestra escolhido dentro do conjunto (registro, função melódica ou harmônica) e demonstrar sua postura correta',
            ],
          },
          {
            code: 'MUSIC.ORCHESTRA.FIRST_SOUNDS',
            title: 'Primeiros Sons no Instrumento',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['video', 'audio'],
            starterObjectives: [
              'Produzir com afinação correta as primeiras notas do instrumento de orquestra escolhido',
            ],
          },
          {
            code: 'MUSIC.ORCHESTRA.ENSEMBLE_LISTENING',
            title: 'Escuta em Conjunto',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['audio', 'observation'],
            starterObjectives: [
              'Tocar ou cantar uma parte simples junto com um áudio de acompanhamento ou outro instrumentista, mantendo o tempo do conjunto',
            ],
          },
          {
            code: 'MUSIC.ORCHESTRA.PRACTICE_ROUTINE',
            title: 'Rotina de Prática',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Manter um registro de prática diária por pelo menos duas semanas seguidas, anotando o que foi praticado e por quanto tempo',
            ],
          },
          {
            code: 'MUSIC.ORCHESTRA.INSTRUMENT_CARE',
            title: 'Cuidado com o Instrumento',
            level: 1,
            ageRecommendation: { min: 8, max: 15 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar cuidados básicos de manuseio, transporte e armazenamento do instrumento de orquestra escolhido',
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
// above. progressionAxis/educationalStages metadata is derived
// automatically by createCompetencyDefinitionSchema's transform
// (packages/contracts/src/curriculum-definitions.ts, PR #154) from the
// code and ageRecommendation -- none of these codes contain an
// EDUCATIONAL_STAGE path segment, so every competency here resolves to
// `progressionAxis: 'DOMAIN_PROFICIENCY'`, matching
// docs/architecture/universal-educational-taxonomy.md's guidance that
// Música uses DOMAIN_PROFICIENCY.

export function buildMusicInstrumentsDomainDto(seed: MusicInstrumentsDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildMusicInstrumentsPathDto(
  seed: MusicInstrumentsPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildMusicInstrumentsCompetencyDto(
  seed: MusicInstrumentsCompetencySeed,
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
