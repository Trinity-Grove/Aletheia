import {
  createCompetencyDefinitionSchema,
  createLearningDomainSchema,
  createLearningPathSchema,
  type CreateCompetencyDefinitionOutput,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
} from '@aletheia/contracts';
import { buildPortugueseSubjectSeedData } from './portuguese-subject.seed-data.js';

export type LanguageCode = 'ENGLISH' | 'PORTUGUESE' | 'SPANISH';
export type LanguageTrack = 'NATIVE_LITERACY' | 'ADDITIONAL_LANGUAGE';

export interface LanguageSubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
  proficiencyFramework?: 'CEFR';
  proficiencyLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}

export interface LanguageSubjectPathSeedData {
  path: { code: string; name: string; description: string };
  competencies: LanguageSubjectCompetencySeed[];
}

export interface LanguageSubjectSeedData {
  domain: { code: LanguageCode; name: string; description: string };
  paths: LanguageSubjectPathSeedData[];
}

const languageProfiles: Record<LanguageCode, { name: string; adjective: string; native: string[]; additional: string[] }> = {
  ENGLISH: {
    name: 'English',
    adjective: 'English',
    native: ['Oral expression', 'Reading fluency', 'Composition', 'Grammar and style', 'Literature and rhetoric'],
    additional: ['Foundations and introductions', 'Everyday communication', 'Independent communication', 'Argumentation and interaction', 'Academic fluency'],
  },
  PORTUGUESE: {
    name: 'Português',
    adjective: 'Português',
    native: ['Expressão oral', 'Fluência leitora', 'Composição', 'Gramática e estilo', 'Literatura e retórica'],
    additional: ['Fundamentos e apresentações', 'Comunicação cotidiana', 'Comunicação independente', 'Argumentação e interação', 'Fluência acadêmica'],
  },
  SPANISH: {
    name: 'Español',
    adjective: 'Español',
    native: ['Expresión oral', 'Fluidez lectora', 'Composición', 'Gramática y estilo', 'Literatura y retórica'],
    additional: ['Fundamentos y presentaciones', 'Comunicación cotidiana', 'Comunicación independiente', 'Argumentación e interacción', 'Fluidez académica'],
  },
};

const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

export function buildLanguageSubjectSeedData(): LanguageSubjectSeedData[] {
  return (Object.keys(languageProfiles) as LanguageCode[]).map((code) => {
    const profile = languageProfiles[code];
    return {
      domain: {
        code,
        name: profile.name,
        description: `${profile.name}: progressão de alfabetização nativa e aprendizagem como língua adicional, com evidências e objetivos comuns.`,
      },
      paths: [
        {
          path: {
            code: `${code}.NATIVE_LITERACY`,
            name: `${profile.name} — alfabetização e domínio nativos`,
            description: `Trilha para falantes nativos: leitura, escrita, expressão, gramática, literatura e retórica em progressão escolar.`,
          },
          competencies: profile.native.map((title, index) => ({
            code: `${code}.NATIVE_LITERACY.${['ORAL_EXPRESSION', 'READING_FLUENCY', 'COMPOSITION', 'GRAMMAR_STYLE', 'LITERATURE_RHETORIC'][index]}`,
            title,
            level: index + 1,
            ageRecommendation: { min: index < 2 ? 6 : 8, max: 18 },
            evidenceTypes: index === 0 ? ['audio', 'video', 'observation'] : ['text', 'observation'],
            starterObjectives: nativeObjectives(code, index),
          })),
        },
        {
          path: {
            code: `${code}.ADDITIONAL_LANGUAGE`,
            name: `${profile.name} — língua adicional (CEFR)`,
            description: `Trilha para quem aprende ${profile.adjective} como língua adicional, organizada pelos níveis A1 a C1 do CEFR.`,
          },
          competencies: profile.additional.map((title, index) => ({
            code: `${code}.ADDITIONAL_LANGUAGE.${cefrLevels[index]}`,
            title: `${cefrLevels[index]} — ${title}`,
            level: index + 1,
            ageRecommendation: { min: 6, max: 18 },
            evidenceTypes: ['audio', 'text', 'observation'],
            starterObjectives: additionalObjectives(code, index),
            proficiencyFramework: 'CEFR' as const,
            proficiencyLevel: cefrLevels[index],
          })),
        },
      ],
    };
  });
}

/**
 * Complete language catalog. Portuguese already had age-band paths; keeping
 * them in this aggregate makes LanguageSubjectSeeder the single owner of all
 * language content while the legacy PortugueseSubjectSeeder remains usable by
 * existing scripts and integrations.
 */
export function buildLanguageSubjectCatalogSeedData(): LanguageSubjectSeedData[] {
  const profileData = buildLanguageSubjectSeedData();
  const portugueseAcademic = buildPortugueseSubjectSeedData();
  return profileData.map((language) =>
    language.domain.code === 'PORTUGUESE'
      ? { ...language, paths: [...language.paths, ...portugueseAcademic.paths] }
      : language,
  );
}

function nativeObjectives(code: LanguageCode, index: number): string[] {
  const objectives: Record<LanguageCode, string[][]> = {
    ENGLISH: [
      ['Participate in conversations with clear turn-taking and understandable speech', 'Retell an experience with a coherent sequence of events'],
      ['Read age-appropriate texts accurately and with expressive phrasing', 'Use details from a text to explain its central idea'],
      ['Write organized narratives and explanations for a defined audience', 'Revise a draft for clarity, structure, and precise word choice'],
      ['Apply sentence structure, punctuation, and register intentionally', 'Explain how grammar and style choices change meaning or effect'],
      ['Interpret literary works using form, context, and textual evidence', 'Build a supported rhetorical reading for a real audience'],
    ],
    PORTUGUESE: [
      ['Participar de conversas com turnos claros e fala compreensível', 'Relatar uma experiência em sequência coerente'],
      ['Ler textos adequados à idade com precisão e entonação expressiva', 'Usar detalhes do texto para explicar sua ideia central'],
      ['Escrever narrativas e explicações organizadas para um público definido', 'Revisar um rascunho para melhorar clareza, estrutura e escolha de palavras'],
      ['Aplicar estrutura de orações, pontuação e registro de forma intencional', 'Explicar como escolhas gramaticais e estilísticas alteram o sentido'],
      ['Interpretar obras literárias usando forma, contexto e evidências textuais', 'Construir uma leitura retórica fundamentada para um público real'],
    ],
    SPANISH: [
      ['Participar en conversaciones respetando turnos y con habla comprensible', 'Relatar una experiencia en una secuencia coherente'],
      ['Leer textos apropiados para la edad con precisión y entonación expresiva', 'Usar detalles del texto para explicar su idea central'],
      ['Escribir narraciones y explicaciones organizadas para un público definido', 'Revisar un borrador para mejorar claridad, estructura y elección de palabras'],
      ['Aplicar estructura de oraciones, puntuación y registro de forma intencional', 'Explicar cómo las elecciones gramaticales y estilísticas cambian el sentido'],
      ['Interpretar obras literarias usando forma, contexto y evidencias textuales', 'Construir una lectura retórica fundamentada para un público real'],
    ],
  };
  return objectives[code]![index]!;
}

function additionalObjectives(code: LanguageCode, index: number): string[] {
  const objectives: Record<LanguageCode, string[][]> = {
    ENGLISH: [
      ['Introduce yourself and exchange basic personal information', 'Understand and produce simple requests, numbers, and everyday phrases'],
      ['Handle routine exchanges about familiar needs and activities', 'Understand the main point of short, clear messages and conversations'],
      ['Describe experiences, plans, and opinions with connected speech', 'Follow the main ideas of clear standard speech and texts on familiar topics'],
      ['Interact with fluency enough for regular conversation with native speakers', 'Present arguments and support a position with relevant reasons and examples'],
      ['Understand demanding texts and implicit meaning across domains', 'Communicate precisely and flexibly in academic, professional, and social contexts'],
    ],
    PORTUGUESE: [
      ['Apresentar-se e trocar informações pessoais básicas', 'Compreender e produzir pedidos simples, números e expressões cotidianas'],
      ['Resolver trocas rotineiras sobre necessidades e atividades conhecidas', 'Compreender a ideia principal de mensagens e conversas claras'],
      ['Descrever experiências, planos e opiniões com fala conectada', 'Acompanhar as ideias principais de textos e falas claras sobre temas conhecidos'],
      ['Interagir com fluência suficiente para conversas regulares com falantes nativos', 'Apresentar argumentos e sustentar uma posição com razões e exemplos relevantes'],
      ['Compreender textos exigentes e sentidos implícitos em diferentes áreas', 'Comunicar-se com precisão e flexibilidade em contextos acadêmicos, profissionais e sociais'],
    ],
    SPANISH: [
      ['Presentarse e intercambiar información personal básica', 'Comprender y producir solicitudes simples, números y expresiones cotidianas'],
      ['Resolver intercambios rutinarios sobre necesidades y actividades conocidas', 'Comprender la idea principal de mensajes y conversaciones claras'],
      ['Describir experiencias, planes y opiniones con discurso conectado', 'Seguir las ideas principales de textos y habla clara sobre temas conocidos'],
      ['Interactuar con fluidez suficiente para conversar regularmente con hablantes nativos', 'Presentar argumentos y sostener una posición con razones y ejemplos relevantes'],
      ['Comprender textos exigentes y significados implícitos en distintos ámbitos', 'Comunicarse con precisión y flexibilidad en contextos académicos, profesionales y sociales'],
    ],
  };
  return objectives[code]![index]!;
}

export function buildLanguageSubjectDomainDto(seed: LanguageSubjectSeedData['domain']): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse(seed);
}

export function buildLanguageSubjectPathDto(seed: LanguageSubjectPathSeedData['path'], domainId: string): CreateLearningPathOutput {
  return createLearningPathSchema.parse({ ...seed, domainId });
}

export function buildLanguageSubjectCompetencyDto(
  seed: LanguageSubjectCompetencySeed,
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
      ...(seed.proficiencyFramework ? { proficiencyFramework: seed.proficiencyFramework } : {}),
      ...(seed.proficiencyLevel ? { proficiencyLevel: seed.proficiencyLevel } : {}),
    },
  });
}
