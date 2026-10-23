import {
  createCompetencyDefinitionSchema,
  createLearningDomainSchema,
} from '@aletheia/contracts';
import type {
  CreateCompetencyDefinitionOutput,
  CreateLearningDomainOutput,
  CreateLearningPathOutput,
} from '@aletheia/contracts';
import { createLearningPathSchema } from '@aletheia/contracts';

export interface TriviumCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TriviumPathSeed {
  code: string;
  name: string;
  description: string;
  ageRecommendation: { min: number; max: number };
  educationalStages: Array<'EARLY_YEARS' | 'PRIMARY' | 'LOWER_SECONDARY' | 'UPPER_SECONDARY'>;
  competencies: TriviumCompetencySeed[];
}

export interface TriviumFormationSeedData {
  domain: { code: string; name: string; description: string };
  paths: TriviumPathSeed[];
}

export function buildTriviumFormationSeedData(): TriviumFormationSeedData {
  return {
    domain: {
      code: 'CLASSICAL_EDUCATION',
      name: 'Educação Clássica',
      description: 'Formação por meio das artes da linguagem: compreender palavras e textos, raciocinar com clareza e comunicar ideias com responsabilidade.',
    },
    paths: [
      {
        code: 'TRIVIUM.GRAMMAR',
        name: 'Gramática',
        description: 'Desenvolve atenção à linguagem, leitura cuidadosa, vocabulário e fundamentos para compreender e expressar ideias.',
        ageRecommendation: { min: 6, max: 11 },
        educationalStages: ['EARLY_YEARS', 'PRIMARY'],
        competencies: [
          { code: 'TRIVIUM.GRAMMAR.LANGUAGE_PATTERNS', title: 'Padrões da linguagem', level: 1, ageRecommendation: { min: 6, max: 10 }, evidenceTypes: ['text', 'audio', 'observation'], starterObjectives: ['Identificar padrões de sons, palavras e frases em textos ou conversas adequados ao momento do estudante.'] },
          { code: 'TRIVIUM.GRAMMAR.CLOSE_READING', title: 'Leitura atenta', level: 1, ageRecommendation: { min: 7, max: 11 }, evidenceTypes: ['text', 'audio', 'observation'], starterObjectives: ['Recontar as ideias principais de um texto e apontar detalhes que apoiem essa compreensão.'] },
          { code: 'TRIVIUM.GRAMMAR.VOCABULARY_MEMORY', title: 'Vocabulário e memória', level: 1, ageRecommendation: { min: 6, max: 11 }, evidenceTypes: ['text', 'audio'], starterObjectives: ['Registrar palavras ou informações relevantes de um tema e explicar como se relacionam.'] },
        ],
      },
      {
        code: 'TRIVIUM.LOGIC',
        name: 'Lógica',
        description: 'Ajuda o estudante a fazer boas perguntas, relacionar ideias, reconhecer razões e avaliar conclusões com cuidado.',
        ageRecommendation: { min: 10, max: 15 },
        educationalStages: ['PRIMARY', 'LOWER_SECONDARY'],
        competencies: [
          { code: 'TRIVIUM.LOGIC.QUESTIONING', title: 'Perguntas e investigação', level: 1, ageRecommendation: { min: 9, max: 14 }, evidenceTypes: ['text', 'observation'], starterObjectives: ['Formular perguntas que ajudem a esclarecer um tema e separar o que já se sabe do que ainda precisa ser investigado.'] },
          { code: 'TRIVIUM.LOGIC.CLAIMS_AND_REASONS', title: 'Afirmações e razões', level: 1, ageRecommendation: { min: 10, max: 15 }, evidenceTypes: ['text', 'audio'], starterObjectives: ['Apresentar uma afirmação e indicar razões ou evidências que a sustentem, reconhecendo dúvidas relevantes.'] },
          { code: 'TRIVIUM.LOGIC.REASONING', title: 'Relações e conclusões', level: 1, ageRecommendation: { min: 10, max: 15 }, evidenceTypes: ['text', 'observation'], starterObjectives: ['Comparar duas ideias, identificar uma relação entre elas e explicar se a conclusão decorre das razões apresentadas.'] },
        ],
      },
      {
        code: 'TRIVIUM.RHETORIC',
        name: 'Retórica',
        description: 'Forma a capacidade de comunicar ideias com clareza, considerar quem ouve ou lê e revisar a mensagem com responsabilidade.',
        ageRecommendation: { min: 13, max: 18 },
        educationalStages: ['LOWER_SECONDARY', 'UPPER_SECONDARY'],
        competencies: [
          { code: 'TRIVIUM.RHETORIC.AUDIENCE_AND_PURPOSE', title: 'Público e propósito', level: 1, ageRecommendation: { min: 12, max: 17 }, evidenceTypes: ['text', 'audio', 'video'], starterObjectives: ['Adaptar uma explicação ou apresentação ao público e ao propósito, mantendo precisão e respeito.'] },
          { code: 'TRIVIUM.RHETORIC.COMPOSITION', title: 'Composição e argumentação', level: 1, ageRecommendation: { min: 13, max: 18 }, evidenceTypes: ['text', 'audio', 'video'], starterObjectives: ['Organizar uma comunicação com ideia central, razões ou exemplos e um encerramento adequado ao propósito.'] },
          { code: 'TRIVIUM.RHETORIC.REVISION_AND_DELIVERY', title: 'Revisão e apresentação', level: 1, ageRecommendation: { min: 13, max: 18 }, evidenceTypes: ['text', 'audio', 'video', 'observation'], starterObjectives: ['Revisar e apresentar uma produção, usando comentários recebidos para tornar a mensagem mais clara.'] },
        ],
      },
    ],
  };
}

export function buildTriviumFormationDomainDto(seed: TriviumFormationSeedData['domain']): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse(seed);
}

export function buildTriviumFormationPathDto(seed: TriviumPathSeed, domainId: string): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    domainId,
    name: seed.name,
    description: seed.description,
    metadata: {
      progressionAxis: 'DOMAIN_PROFICIENCY',
      ageRecommendation: seed.ageRecommendation,
      educationalStages: seed.educationalStages,
      recommended: true,
    },
  });
}

export function buildTriviumFormationCompetencyDto(
  seed: TriviumCompetencySeed,
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
