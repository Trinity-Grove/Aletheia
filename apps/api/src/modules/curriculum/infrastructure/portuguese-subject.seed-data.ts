import {
  createCompetencyDefinitionSchema,
  createLearningDomainSchema,
  createLearningPathSchema,
  type CreateCompetencyDefinitionOutput,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
} from '@aletheia/contracts';

// Core academic subject seed data for the first Portuguese slice. The
// subject is split by EducationalStage so families can later choose a
// developmentally appropriate path instead of receiving one flat list.

const DOMAIN_CODE = 'PORTUGUESE';
const EARLY_YEARS_PATH_CODE = 'PORTUGUESE.EARLY_YEARS';
const PRIMARY_GRAMMAR_PATH_CODE = 'PORTUGUESE.PRIMARY_GRAMMAR';
const MIDDLE_LOGIC_PATH_CODE = 'PORTUGUESE.MIDDLE_LOGIC';
const HIGH_RHETORIC_PATH_CODE = 'PORTUGUESE.HIGH_RHETORIC';

export interface PortugueseSubjectDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface PortugueseSubjectPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface PortugueseSubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface PortugueseSubjectPathSeedData {
  path: PortugueseSubjectPathSeed;
  competencies: PortugueseSubjectCompetencySeed[];
}

export interface PortugueseSubjectSeedData {
  domain: PortugueseSubjectDomainSeed;
  paths: PortugueseSubjectPathSeedData[];
}

export function buildPortugueseSubjectSeedData(): PortugueseSubjectSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Português',
      description:
        'Linguagem oral e escrita, leitura, produção de textos e comunicação, com progressão por faixa de idade e estágio educacional.',
    },
    paths: [
      {
        path: {
          code: EARLY_YEARS_PATH_CODE,
          name: 'Português -- Educação Infantil (Early Years)',
          description:
            'Português para a Educação Infantil (aproximadamente 4 a 6 anos): escuta, fala, consciência sonora, contato com livros e primeiras hipóteses de escrita.',
        },
        competencies: [
          {
            code: 'PORTUGUESE.EARLY_YEARS.ORAL_LANGUAGE',
            title: 'Linguagem Oral e Conversação',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Relatar uma experiência pessoal em sequência compreensível',
              'Participar de uma conversa, aguardando a vez e respondendo ao que foi dito',
            ],
          },
          {
            code: 'PORTUGUESE.EARLY_YEARS.LISTENING_STORIES',
            title: 'Escuta e Reconto de Histórias',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['observation', 'text'],
            starterObjectives: [
              'Ouvir uma história até o fim e identificar personagens e acontecimentos principais',
              'Recontar uma história conhecida usando palavras próprias e uma ordem aproximada dos fatos',
            ],
          },
          {
            code: 'PORTUGUESE.EARLY_YEARS.PHONOLOGICAL_AWARENESS',
            title: 'Consciência Sonora',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['observation', 'audio'],
            starterObjectives: [
              'Perceber rimas e repetições sonoras em cantigas e poemas infantis',
              'Separar oralmente palavras em partes sonoras simples, como sílabas',
            ],
          },
          {
            code: 'PORTUGUESE.EARLY_YEARS.EMERGENT_WRITING',
            title: 'Escrita Emergente',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Registrar o próprio nome e reconhecer letras que aparecem nele',
              'Produzir uma escrita espontânea para comunicar uma ideia, mesmo antes da escrita convencional',
            ],
          },
          {
            code: 'PORTUGUESE.EARLY_YEARS.PRE_READING',
            title: 'Aproximação com a Leitura',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['observation', 'photo'],
            starterObjectives: [
              'Manusear livros respeitando sua orientação e localizar capa, título e ilustrações',
              'Relacionar algumas letras e palavras conhecidas aos seus sons ou significados',
            ],
          },
        ],
      },
      {
        path: {
          code: PRIMARY_GRAMMAR_PATH_CODE,
          name: 'Português -- Ensino Fundamental I (Grammar)',
          description:
            'Português para o Ensino Fundamental I (aproximadamente 6 a 10 anos): fluência leitora, compreensão, ortografia, produção textual e apresentação oral.',
        },
        competencies: [
          {
            code: 'PORTUGUESE.PRIMARY_GRAMMAR.READING_FLUENCY',
            title: 'Fluência de Leitura',
            level: 2,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['audio', 'text'],
            starterObjectives: [
              'Ler um texto adequado à faixa etária com precisão e ritmo compreensível',
              'Ajustar a entonação em frases interrogativas, exclamativas e em diálogos',
            ],
          },
          {
            code: 'PORTUGUESE.PRIMARY_GRAMMAR.TEXT_COMPREHENSION',
            title: 'Compreensão de Textos',
            level: 2,
            ageRecommendation: { min: 6, max: 10 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Identificar o assunto, as informações principais e a sequência de um texto',
              'Responder perguntas sobre o texto usando evidências encontradas na leitura',
            ],
          },
          {
            code: 'PORTUGUESE.PRIMARY_GRAMMAR.NARRATIVE_WRITING',
            title: 'Produção de Texto Narrativo',
            level: 2,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Escrever uma narrativa curta com personagens, cenário, começo, desenvolvimento e desfecho',
              'Revisar o texto para melhorar clareza, sequência dos acontecimentos e escolha de palavras',
            ],
          },
          {
            code: 'PORTUGUESE.PRIMARY_GRAMMAR.ORTHOGRAPHY',
            title: 'Ortografia e Convenções da Escrita',
            level: 2,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Usar correspondências regulares entre sons e letras em palavras de uso frequente',
              'Aplicar pontuação básica, separação de palavras e uso de letras maiúsculas em um texto revisado',
            ],
          },
          {
            code: 'PORTUGUESE.PRIMARY_GRAMMAR.ORAL_PRESENTATION',
            title: 'Apresentação Oral',
            level: 2,
            ageRecommendation: { min: 6, max: 10 },
            evidenceTypes: ['audio', 'video', 'observation'],
            starterObjectives: [
              'Apresentar um assunto conhecido com começo, desenvolvimento e conclusão',
              'Falar de modo audível, consultar anotações quando necessário e responder perguntas do público',
            ],
          },
        ],
      },
      {
        path: {
          code: MIDDLE_LOGIC_PATH_CODE,
          name: 'Português -- Ensino Fundamental II (Logic)',
          description:
            'Português para o Ensino Fundamental II (aproximadamente 11 a 14 anos): análise de textos, argumentação, sintaxe, literatura e comunicação oral.',
        },
        competencies: [
          {
            code: 'PORTUGUESE.MIDDLE_LOGIC.TEXT_ANALYSIS',
            title: 'Análise e Interpretação de Textos',
            level: 3,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Analisar tema, ponto de vista, estrutura e recursos expressivos em textos de gêneros variados',
              'Relacionar informações explícitas e implícitas para sustentar uma interpretação',
            ],
          },
          {
            code: 'PORTUGUESE.MIDDLE_LOGIC.ARGUMENTATIVE_WRITING',
            title: 'Produção de Texto Argumentativo',
            level: 3,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Escrever um texto argumentativo com tese clara, razões organizadas e conclusão coerente',
              'Usar exemplos e informações verificáveis para sustentar uma posição em um tema apropriado à idade',
            ],
          },
          {
            code: 'PORTUGUESE.MIDDLE_LOGIC.SYNTAX',
            title: 'Sintaxe e Coesão',
            level: 3,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Reconhecer funções sintáticas básicas e a relação entre as partes de uma oração',
              'Revisar períodos para melhorar concordância, coesão e clareza das ideias',
            ],
          },
          {
            code: 'PORTUGUESE.MIDDLE_LOGIC.LITERARY_READING',
            title: 'Leitura Literária',
            level: 3,
            ageRecommendation: { min: 10, max: 14 },
            evidenceTypes: ['text', 'audio'],
            starterObjectives: [
              'Interpretar personagens, conflitos, narrador e ambientação em uma obra literária',
              'Comparar duas leituras literárias, apontando temas, escolhas de linguagem e efeitos produzidos',
            ],
          },
          {
            code: 'PORTUGUESE.MIDDLE_LOGIC.ORAL_DEBATE',
            title: 'Debate e Comunicação Oral',
            level: 3,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['audio', 'video', 'observation'],
            starterObjectives: [
              'Participar de um debate apresentando argumentos relacionados ao tema e ouvindo posições diferentes',
              'Responder a perguntas com clareza, distinguindo opinião, exemplo e informação',
            ],
          },
        ],
      },
      {
        path: {
          code: HIGH_RHETORIC_PATH_CODE,
          name: 'Português -- Ensino Médio (Rhetoric)',
          description:
            'Português para o Ensino Médio (aproximadamente 15 a 18 anos): retórica, escrita de pesquisa, leitura crítica, literatura e apresentação pública.',
        },
        competencies: [
          {
            code: 'PORTUGUESE.HIGH_RHETORIC.RHETORICAL_ANALYSIS',
            title: 'Análise Retórica',
            level: 4,
            ageRecommendation: { min: 15, max: 18 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Analisar como escolhas de linguagem, estrutura e recursos retóricos influenciam um público',
              'Avaliar a força de argumentos, pressupostos e evidências em discursos e textos públicos',
            ],
          },
          {
            code: 'PORTUGUESE.HIGH_RHETORIC.RESEARCH_WRITING',
            title: 'Escrita de Pesquisa',
            level: 4,
            ageRecommendation: { min: 15, max: 18 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Formular uma pergunta de pesquisa e organizar fontes confiáveis para investigá-la',
              'Escrever um texto de pesquisa com síntese das fontes, citações identificadas e conclusão própria',
            ],
          },
          {
            code: 'PORTUGUESE.HIGH_RHETORIC.CRITICAL_READING',
            title: 'Leitura Crítica e Mídia',
            level: 4,
            ageRecommendation: { min: 15, max: 18 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Comparar textos sobre um mesmo assunto, identificando perspectivas, seleção de fatos e possíveis vieses',
              'Verificar a consistência de uma afirmação antes de compartilhá-la ou usá-la como evidência',
            ],
          },
          {
            code: 'PORTUGUESE.HIGH_RHETORIC.LITERARY_CANON',
            title: 'Literatura e Tradição',
            level: 4,
            ageRecommendation: { min: 15, max: 18 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Ler obras literárias de períodos e estilos distintos, relacionando forma, contexto e temas humanos',
              'Construir uma interpretação própria de uma obra usando passagens e elementos formais como evidência',
            ],
          },
          {
            code: 'PORTUGUESE.HIGH_RHETORIC.PUBLIC_SPEAKING',
            title: 'Oratória e Apresentação Pública',
            level: 4,
            ageRecommendation: { min: 15, max: 18 },
            evidenceTypes: ['audio', 'video', 'observation'],
            starterObjectives: [
              'Planejar e realizar uma apresentação pública com propósito, estrutura, fontes e conclusão claros',
              'Adaptar vocabulário, ritmo e recursos visuais ao público, respondendo perguntas com precisão',
            ],
          },
        ],
      },
    ],
  };
}

export function buildPortugueseSubjectDomainDto(seed: PortugueseSubjectDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({ code: seed.code, name: seed.name, description: seed.description });
}

export function buildPortugueseSubjectPathDto(
  seed: PortugueseSubjectPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({ code: seed.code, name: seed.name, description: seed.description, domainId });
}

export function buildPortugueseSubjectCompetencyDto(
  seed: PortugueseSubjectCompetencySeed,
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
