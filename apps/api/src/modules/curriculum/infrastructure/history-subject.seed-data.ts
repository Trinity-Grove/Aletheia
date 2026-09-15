import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Core academic subject seed data: "História" ---
//
// Issue #144 Lote 1: third core academic subject, after Matemática
// (#142/#145) and Ciências (#147). Same shape and reasoning: real
// grade/age progression via multiple LearningPaths under one
// LearningDomain, grade-band naming aligned with this codebase's
// existing EducationalStage convention (apps/api/prisma/schema.prisma,
// packages/contracts/src/learner.ts, the exact Portuguese labels already
// shown to families in apps/web/src/components/learners/
// learner-form-modal.tsx):
//   EARLY_YEARS      -> "Educação Infantil (Early Years)"
//   PRIMARY_GRAMMAR  -> "Ensino Fundamental I (Grammar)"
//   MIDDLE_LOGIC     -> "Ensino Fundamental II (Logic)"
//   HIGH_RHETORIC    -> "Ensino Médio (Rhetoric)"
//
// This first slice covers three bands -- EARLY_YEARS (pre-chronological:
// personal/family history, sense of time, no formal dates/periods yet),
// PRIMARY_GRAMMAR (História do Brasil basics: indigenous peoples,
// colonization, independence/empire, local history, an introduction to
// historical sources) and MIDDLE_LOGIC (ancient civilizations, Middle
// Ages, maritime expansion, Brazilian slavery/abolition, the Industrial
// Revolution, an introduction to comparing sources/perspectives).
// HIGH_RHETORIC is deliberately NOT covered here: a real Ensino Médio
// history curriculum needs modern/contemporary history (world wars, Cold
// War, globalization) and real historiographic analysis, a meaningfully
// bigger step than extending the existing pattern -- left as explicit
// follow-up.
//
// Pre-existing content: curriculum-template.engine.ts has a flat
// "História" Subject stub in the TRADITIONAL framework (description:
// "História do Brasil e marcos fundamentais da civilização", starter
// objectives about "períodos fundamentais da História do Brasil" and
// "causas e impactos das grandes navegações e colonização") and a
// "História Ocidental & Antiga" stub in CLASSICAL_TRIVIUM (Antiguidade,
// Grécia, Roma, História Sagrada) -- both still drive applyTemplate's
// legacy plan for their respective frameworks. This domain doesn't touch
// or duplicate either -- both coexist. The tone/scope below was
// cross-checked against them to stay consistent (Brazilian history
// periods, the great navigations/colonization, and ancient civilizations
// all reappear here as real, separately trackable competencies instead
// of two generic starter objectives per framework).

const DOMAIN_CODE = 'HISTORY';
const EARLY_YEARS_PATH_CODE = 'HISTORY.EARLY_YEARS';
const PRIMARY_GRAMMAR_PATH_CODE = 'HISTORY.PRIMARY_GRAMMAR';
const MIDDLE_LOGIC_PATH_CODE = 'HISTORY.MIDDLE_LOGIC';

export interface HistorySubjectDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface HistorySubjectPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface HistorySubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface HistorySubjectPathSeedData {
  path: HistorySubjectPathSeed;
  competencies: HistorySubjectCompetencySeed[];
}

export interface HistorySubjectSeedData {
  domain: HistorySubjectDomainSeed;
  paths: HistorySubjectPathSeedData[];
}

export function buildHistorySubjectSeedData(): HistorySubjectSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'História',
      description:
        'Compreensão do tempo histórico, causas e consequências dos eventos humanos, e desenvolvimento de pensamento crítico sobre fontes e perspectivas, com progressão real por faixa de idade/série -- cada trilha deste domínio corresponde a um estágio educacional (EducationalStage), começando pela noção de tempo pessoal e familiar e avançando para a história do Brasil e civilizações antigas em nível fundamental. Uma análise historiográfica mais aprofundada para o Ensino Médio é trabalho futuro, não coberta nesta fatia.',
    },
    paths: [
      {
        path: {
          code: EARLY_YEARS_PATH_CODE,
          name: 'História -- Educação Infantil (Early Years)',
          description:
            'História para a Educação Infantil (aproximadamente 4 a 5 anos) -- noção de tempo, história pessoal e familiar, tradições, comparação entre antigo e novo, escuta e recontação de histórias, sem cronologia formal ainda.',
        },
        competencies: [
          {
            code: 'HISTORY.EARLY_YEARS.PAST_PRESENT',
            title: 'Noção de Passado, Presente e Futuro',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['observation', 'video'],
            starterObjectives: [
              'Diferenciar eventos do passado, do presente e do futuro em uma conversa ou história simples',
              'Ordenar até três imagens de uma sequência temporal simples (ex.: antes, durante, depois)',
            ],
          },
          {
            code: 'HISTORY.EARLY_YEARS.FAMILY_HISTORY',
            title: 'História da Própria Família',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['video', 'text'],
            starterObjectives: [
              'Contar uma história simples sobre a própria família (ex.: como os pais se conheceram, uma tradição familiar)',
            ],
          },
          {
            code: 'HISTORY.EARLY_YEARS.TRADITIONS',
            title: 'Tradições e Costumes',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Identificar e descrever pelo menos uma tradição ou costume da própria família ou comunidade',
            ],
          },
          {
            code: 'HISTORY.EARLY_YEARS.OLD_VS_NEW',
            title: 'Objetos e Lugares Antigos e Novos',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Comparar um objeto ou lugar antigo com um moderno, explicando o que mudou',
            ],
          },
          {
            code: 'HISTORY.EARLY_YEARS.STORYTELLING',
            title: 'Escuta e Recontação de Histórias',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['video', 'observation'],
            starterObjectives: [
              'Ouvir uma história ou lenda simples e recontá-la com as próprias palavras, na ordem correta dos eventos',
            ],
          },
        ],
      },
      {
        path: {
          code: PRIMARY_GRAMMAR_PATH_CODE,
          name: 'História -- Ensino Fundamental I (Grammar)',
          description:
            'História para o Ensino Fundamental I (aproximadamente 6 a 10 anos) -- linha do tempo básica, povos indígenas originários, grandes navegações e colonização do Brasil, Independência e Império, história da comunidade local, introdução a fontes históricas.',
        },
        competencies: [
          {
            code: 'HISTORY.PRIMARY_GRAMMAR.TIMELINE_BASICS',
            title: 'Linha do Tempo Básica',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Construir uma linha do tempo simples com pelo menos cinco eventos, em ordem cronológica',
              'Explicar a diferença entre século, década e ano',
            ],
          },
          {
            code: 'HISTORY.PRIMARY_GRAMMAR.INDIGENOUS_PEOPLES',
            title: 'Povos Indígenas Originários',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Descrever aspectos da vida dos povos indígenas que habitavam o território brasileiro antes da colonização',
            ],
          },
          {
            code: 'HISTORY.PRIMARY_GRAMMAR.DISCOVERY_COLONIZATION',
            title: 'Grandes Navegações e Colonização do Brasil',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar as causas e os principais eventos das grandes navegações e da colonização do Brasil',
            ],
          },
          {
            code: 'HISTORY.PRIMARY_GRAMMAR.BRAZILIAN_EMPIRE_REPUBLIC',
            title: 'Independência, Império e Primeira República do Brasil',
            level: 1,
            ageRecommendation: { min: 8, max: 10 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Descrever, em ordem cronológica, os principais marcos da Independência do Brasil, do Império e do início da República',
            ],
          },
          {
            code: 'HISTORY.PRIMARY_GRAMMAR.LOCAL_COMMUNITY_HISTORY',
            title: 'História da Comunidade Local',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Pesquisar e apresentar um fato histórico relevante da própria cidade ou região',
            ],
          },
          {
            code: 'HISTORY.PRIMARY_GRAMMAR.HISTORICAL_SOURCES_INTRO',
            title: 'Introdução a Fontes Históricas',
            level: 1,
            ageRecommendation: { min: 8, max: 10 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Identificar diferentes tipos de fontes históricas (fotografias, documentos, objetos, relatos orais) e explicar o que cada uma pode ensinar sobre o passado',
            ],
          },
        ],
      },
      {
        path: {
          code: MIDDLE_LOGIC_PATH_CODE,
          name: 'História -- Ensino Fundamental II (Logic)',
          description:
            'História para o Ensino Fundamental II (aproximadamente 11 a 14 anos) -- civilizações antigas, Idade Média, expansão marítima europeia, escravidão e abolição no Brasil, Revolução Industrial, introdução à análise de fontes e múltiplas perspectivas.',
        },
        competencies: [
          {
            code: 'HISTORY.MIDDLE_LOGIC.ANCIENT_CIVILIZATIONS',
            title: 'Civilizações Antigas',
            level: 2,
            ageRecommendation: { min: 10, max: 12 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Comparar pelo menos duas civilizações antigas (ex.: Egito, Mesopotâmia, Grécia, Roma), identificando contribuições de cada uma',
            ],
          },
          {
            code: 'HISTORY.MIDDLE_LOGIC.MIDDLE_AGES',
            title: 'Idade Média',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Descrever características centrais da Idade Média (ex.: feudalismo, papel da Igreja, sociedade estamental)',
            ],
          },
          {
            code: 'HISTORY.MIDDLE_LOGIC.MARITIME_EXPANSION',
            title: 'Expansão Marítima e Formação do Mundo Moderno',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar as causas e consequências da expansão marítima europeia para diferentes povos e continentes',
            ],
          },
          {
            code: 'HISTORY.MIDDLE_LOGIC.SLAVERY_ABOLITION',
            title: 'Escravidão e Abolição no Brasil',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar o sistema de escravidão no Brasil e o processo histórico que levou à abolição, incluindo a resistência escrava',
            ],
          },
          {
            code: 'HISTORY.MIDDLE_LOGIC.INDUSTRIAL_REVOLUTION',
            title: 'Revolução Industrial',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar as principais mudanças econômicas e sociais causadas pela Revolução Industrial',
            ],
          },
          {
            code: 'HISTORY.MIDDLE_LOGIC.HISTORICAL_ANALYSIS_INTRO',
            title: 'Introdução à Análise de Fontes e Múltiplas Perspectivas',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Comparar duas fontes históricas sobre o mesmo evento, identificando diferenças de perspectiva ou interpretação',
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

export function buildHistorySubjectDomainDto(seed: HistorySubjectDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildHistorySubjectPathDto(
  seed: HistorySubjectPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildHistorySubjectCompetencyDto(
  seed: HistorySubjectCompetencySeed,
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
