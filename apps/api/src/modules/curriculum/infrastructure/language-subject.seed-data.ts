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
export type EducationalStage = 'EARLY_YEARS' | 'PRIMARY' | 'LOWER_SECONDARY' | 'UPPER_SECONDARY';

export interface LanguageSubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
  proficiencyFramework?: 'CEFR';
  proficiencyLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  educationalStage?: EducationalStage;
}

export interface LanguageSubjectPathSeedData {
  path: { code: string; name: string; description: string };
  competencies: LanguageSubjectCompetencySeed[];
}

export interface LanguageSubjectSeedData {
  domain: { code: LanguageCode; name: string; description: string };
  paths: LanguageSubjectPathSeedData[];
}

const languageProfiles: Record<LanguageCode, { name: string; adjective: string; native: string[][]; additional: string[] }> = {
  ENGLISH: {
    name: 'English',
    adjective: 'English',
    native: [
      ['Oral language', 'Phonological awareness', 'Emergent literacy'],
      ['Reading fluency', 'Text comprehension', 'Composition'],
      ['Text analysis', 'Grammar and cohesion', 'Argumentation'],
      ['Rhetorical analysis', 'Research writing', 'Literature and public communication'],
    ],
    additional: ['Foundations and introductions', 'Everyday communication', 'Independent communication', 'Argumentation and interaction', 'Academic fluency'],
  },
  PORTUGUESE: {
    name: 'Português',
    adjective: 'Português',
    native: [
      ['Linguagem oral', 'Consciência sonora', 'Alfabetização emergente'],
      ['Fluência leitora', 'Compreensão de textos', 'Composição'],
      ['Análise de textos', 'Gramática e coesão', 'Argumentação'],
      ['Análise retórica', 'Escrita de pesquisa', 'Literatura e comunicação pública'],
    ],
    additional: ['Fundamentos e apresentações', 'Comunicação cotidiana', 'Comunicação independente', 'Argumentação e interação', 'Fluência acadêmica'],
  },
  SPANISH: {
    name: 'Español',
    adjective: 'Español',
    native: [
      ['Lenguaje oral', 'Conciencia fonológica', 'Alfabetización emergente'],
      ['Fluidez lectora', 'Comprensión de textos', 'Composición'],
      ['Análisis de textos', 'Gramática y cohesión', 'Argumentación'],
      ['Análisis retórico', 'Escritura de investigación', 'Literatura y comunicación pública'],
    ],
    additional: ['Fundamentos y presentaciones', 'Comunicación cotidiana', 'Comunicación independiente', 'Argumentación e interacción', 'Fluidez académica'],
  },
};

const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
const educationalStages: Array<{ code: EducationalStage; name: string; ages: { min: number; max: number } }> = [
  { code: 'EARLY_YEARS', name: 'Early Years / Educação Infantil', ages: { min: 4, max: 5 } },
  { code: 'PRIMARY', name: 'Primary / Ensino Fundamental inicial', ages: { min: 6, max: 10 } },
  { code: 'LOWER_SECONDARY', name: 'Lower Secondary / Ensino Fundamental final', ages: { min: 11, max: 14 } },
  { code: 'UPPER_SECONDARY', name: 'Upper Secondary / Ensino Médio', ages: { min: 15, max: 18 } },
];

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
        ...educationalStages.map((stage, stageIndex) => ({
          path: {
            code: `${code}.NATIVE_LITERACY.${stage.code}`,
            name: `${profile.name} — ${stage.name}`,
            description: `Trilha nativa para ${stage.name.toLowerCase()}, com objetivos de linguagem adequados à faixa etária.`,
          },
          competencies: profile.native[stageIndex]!.map((title, competencyIndex) => ({
            code: `${code}.NATIVE_LITERACY.${stage.code}.${['ORAL_LANGUAGE', 'PHONOLOGICAL_AWARENESS', 'EMERGENT_LITERACY', 'READING_FLUENCY', 'TEXT_COMPREHENSION', 'COMPOSITION', 'TEXT_ANALYSIS', 'GRAMMAR_COHESION', 'ARGUMENTATION', 'RHETORICAL_ANALYSIS', 'RESEARCH_WRITING', 'LITERATURE_PUBLIC_COMMUNICATION'][stageIndex * 3 + competencyIndex]}`,
            title,
            level: stageIndex + 1,
            ageRecommendation: stage.ages,
            evidenceTypes: competencyIndex === 0 ? ['audio', 'video', 'observation'] : ['text', 'observation'],
            starterObjectives: nativeObjectives(code, stageIndex, competencyIndex),
            educationalStage: stage.code,
          })),
        })),
        {
          path: {
            code: `${code}.ADDITIONAL_LANGUAGE`,
            name: `${profile.name} — língua adicional (CEFR)`,
            description: `Trilha para quem aprende ${profile.adjective} como língua adicional, organizada pelos níveis A1 a C1 do CEFR.`,
          },
          competencies: profile.additional.map((title, index) => ({
            code: `${code}.ADDITIONAL_LANGUAGE.${cefrLevels[index]!}`,
            title: `${cefrLevels[index]!} — ${title}`,
            level: index + 1,
            ageRecommendation: { min: 6, max: 18 },
            evidenceTypes: ['audio', 'text', 'observation'],
            starterObjectives: additionalObjectives(code, index),
            proficiencyFramework: 'CEFR' as const,
            proficiencyLevel: cefrLevels[index]!,
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

function nativeObjectives(code: LanguageCode, stageIndex: number, competencyIndex: number): string[] {
  const objectives: Record<LanguageCode, string[][]> = {
    ENGLISH: [
      ['Participate in conversations with clear turn-taking', 'Notice rhymes, syllables, and beginning sounds', 'Connect spoken language, letters, and meaning'],
      ['Read age-appropriate texts accurately and expressively', 'Use details from a text to explain its central idea', 'Write organized narratives and explanations for a defined audience'],
      ['Analyze theme, structure, and evidence in varied texts', 'Revise sentences for cohesion, grammar, and register', 'Write an argument with a clear claim and relevant support'],
      ['Evaluate how rhetorical choices influence an audience', 'Conduct research and synthesize reliable sources', 'Interpret literature and communicate ideas in public settings'],
    ],
    PORTUGUESE: [
      ['Participar de conversas respeitando turnos', 'Perceber rimas, sílabas e sons iniciais', 'Relacionar fala, letras e construção de sentido'],
      ['Ler textos adequados à idade com precisão e expressividade', 'Usar detalhes do texto para explicar sua ideia central', 'Escrever narrativas e explicações organizadas para um público definido'],
      ['Analisar tema, estrutura e evidências em textos variados', 'Revisar frases para melhorar coesão, gramática e registro', 'Escrever um argumento com tese clara e suporte relevante'],
      ['Avaliar como escolhas retóricas influenciam um público', 'Realizar pesquisa e sintetizar fontes confiáveis', 'Interpretar literatura e comunicar ideias em situações públicas'],
    ],
    SPANISH: [
      ['Participar en conversaciones respetando turnos', 'Reconocer rimas, sílabas y sonidos iniciales', 'Relacionar el habla, las letras y la construcción de significado'],
      ['Leer textos apropiados para la edad con precisión y expresividad', 'Usar detalles del texto para explicar su idea central', 'Escribir narraciones y explicaciones organizadas para un público definido'],
      ['Analizar tema, estructura y evidencias en textos variados', 'Revisar oraciones para mejorar cohesión, gramática y registro', 'Escribir un argumento con una tesis clara y apoyo relevante'],
      ['Evaluar cómo las elecciones retóricas influyen en un público', 'Investigar y sintetizar fuentes confiables', 'Interpretar literatura y comunicar ideas en situaciones públicas'],
    ],
  };
  return objectives[code]![stageIndex * 3 + competencyIndex]!;
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
      ...(seed.educationalStage ? { educationalStage: seed.educationalStage } : {}),
    },
  });
}
