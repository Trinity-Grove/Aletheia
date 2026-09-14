import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 20 seed data: "Resiliência, Outdoor e Preparação Familiar" (Primeiros Socorros) ---
//
// Same pattern as the five prior content slices (biblical formation #131,
// music formation #132, trades formation #134, cooking formation #135,
// gardening formation #136): a new, richer Domain -> Path -> Competency
// slice, not a migration of pre-existing hardcoded content.
//
// Naming: section 20 is titled "Educação de sobrevivência" in the issue's
// outline, but the issue text itself explicitly asks for this to be
// internally named "Resiliência, Outdoor e Preparação Familiar" instead
// -- more precise, less "prepper" aesthetic. Used verbatim as the domain
// name here, per that explicit instruction.
//
// Section 20 has six subsections (Primeiros socorros, Navegação,
// Acampamento, Água, Fogo, Emergências reais) rather than the single
// "Fundamentos" subsection the five prior domains had. This slice covers
// ONLY "Primeiros socorros" as the foundational LearningPath -- the most
// universally applicable and safety-critical starting point -- with nine
// competencies, one per item in that subsection: primeiros socorros
// básicos, prevenção de acidentes, ferimentos, queimaduras, engasgo,
// emergências, saber pedir ajuda, conhecimento de números de emergência,
// progressão por idade.
//
// The other five subsections are explicitly NOT covered here, per the
// task's own instruction -- each is naturally its own future LearningPath
// under this same domain:
//   - Navegação (leitura de mapas, bússola, pontos cardeais)
//   - Acampamento (montagem de barraca, abrigo, escolha de local)
//   - Água (armazenamento, tratamento, filtragem, fervura)
//   - Fogo (segurança, fogueira, extinção)
//   - Emergências reais (falta de energia, tempestades, enchentes,
//     evacuação, ponto de encontro familiar, kit de emergência)
//
// Tone (per the issue's own explicit framing, carried over verbatim into
// every objective below): "Evitar armas/técnicas de confronto como
// núcleo -- foco em preservar a vida, prevenir riscos, ajudar e retornar
// à segurança." No objective below involves a weapon or a confrontation
// scenario; every one is about recognizing a situation, staying safe,
// and asking for or giving help -- age-appropriate first response, never
// a substitute for professional medical care, which every objective
// explicitly treats as the next step, not something a child replaces.
//
// Pre-existing content: curriculum-template.engine.ts's
// PRACTICAL_LIFE_AND_RESILIENCE_SUBJECTS already has a "Primeiros
// Socorros e Resiliência" Subject stub (from #94) with two generic
// starter objectives, and still drives applyTemplate's legacy plan. This
// domain doesn't touch or duplicate it -- both coexist, same as every
// prior content slice.

const DOMAIN_CODE = 'RESILIENCE';
const PATH_CODE = 'RESILIENCE.FIRST_AID';

export interface ResilienceFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface ResilienceFormationSeedData {
  domain: ResilienceFormationDomainSeed;
  path: ResilienceFormationPathSeed;
  competencies: ResilienceFormationCompetencySeed[];
}

export function buildResilienceFormationSeedData(): ResilienceFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Resiliência, Outdoor e Preparação Familiar',
      description:
        'Formação para preservar a vida, prevenir riscos e ajudar outras pessoas com calma e método -- começando pelos primeiros socorros, o ponto de partida mais universal e seguro, antes de qualquer trilha futura e separada desta mesma fundação (cada subseção do domínio, uma trilha própria). Foco constante em prevenção, segurança e cuidado com o próximo.',
    },
    path: {
      code: PATH_CODE,
      name: 'Primeiros Socorros',
      description:
        'Trilha de primeiros socorros -- reconhecer uma emergência, agir com segurança dentro do que é apropriado para a idade, e saber pedir ajuda -- sempre como complemento ao atendimento profissional, nunca como substituto (issue #95 seção 20, subseção "Primeiros socorros").',
    },
    competencies: [
      {
        code: 'RESILIENCE.FIRST_AID.BASICS',
        title: 'Primeiros Socorros Básicos',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar os passos básicos de primeiros socorros para uma situação comum (ex.: corte pequeno, torção leve), com supervisão de um adulto responsável',
          'Explicar a sequência básica de resposta a uma emergência: verificar a segurança do local, avaliar a pessoa, pedir ajuda, agir dentro do que sabe fazer',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.ACCIDENT_PREVENTION',
        title: 'Prevenção de Acidentes',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Identificar pelo menos três riscos comuns de acidentes em casa ou ao ar livre e propor como evitar cada um',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.WOUNDS',
        title: 'Ferimentos',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar como limpar e cobrir um ferimento pequeno com segurança, sabendo reconhecer quando é necessário buscar ajuda de um adulto ou profissional',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.BURNS',
        title: 'Queimaduras',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Explicar os primeiros cuidados com uma queimadura leve (resfriar com água corrente, proteger o local) e reconhecer quando procurar atendimento médico',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.CHOKING',
        title: 'Engasgo',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Reconhecer os sinais de que alguém está engasgado e explicar os passos para pedir ajuda imediatamente',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.EMERGENCIES',
        title: 'Emergências',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Reconhecer quando uma situação é uma emergência médica e explicar os primeiros passos a seguir: manter a calma, garantir a segurança, pedir ajuda',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.ASKING_FOR_HELP',
        title: 'Saber Pedir Ajuda',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar como pedir ajuda com clareza em uma situação de emergência, informando o que aconteceu e onde está',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.EMERGENCY_NUMBERS',
        title: 'Conhecimento de Números de Emergência',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['text'],
        starterObjectives: [
          'Memorizar os principais números de emergência (ex.: SAMU, Bombeiros, Polícia) e explicar o que informar em uma ligação',
        ],
      },
      {
        code: 'RESILIENCE.FIRST_AID.AGE_PROGRESSION',
        title: 'Progressão por Idade',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['observation', 'text'],
        starterObjectives: [
          'Reconhecer, com apoio de um responsável, quais ações de primeiros socorros a própria idade já permite realizar com segurança, e quais exigem a presença de um adulto',
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

export function buildResilienceFormationDomainDto(
  seed: ResilienceFormationDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildResilienceFormationPathDto(
  seed: ResilienceFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildResilienceFormationCompetencyDto(
  seed: ResilienceFormationCompetencySeed,
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
