import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 15 seed data: "Ofícios" (fundamentos de segurança e uso de ferramentas) ---
//
// Same pattern as biblical-formation.seed-data.ts (issue #95 section 5,
// PR #131) and music-formation.seed-data.ts (issue #95 section 13, PR
// #132): a new, richer Domain -> Path -> Competency slice, not a
// migration of pre-existing hardcoded content. The pre-existing "Ofícios
// Práticos" subject in curriculum-template.engine.ts's
// ARTS_TRADES_VOCATION_SUBJECTS is a broad catch-all ("Marcenaria,
// culinária, costura, jardinagem, elétrica básica, manutenção
// residencial e artesanato" in one Subject stub with two generic starter
// objectives) and still drives applyTemplate's legacy plan -- both
// coexist. This domain is scoped tighter: not any one trade, but the
// safety/tool-use/risk-awareness foundation every trade requires before a
// learner specializes in one.
//
// Scope is deliberately limited to section 15's "Segurança" subsection
// (uso seguro de ferramentas, EPI, identificação de riscos, supervisão/
// restrição por faixa etária) plus a small set of genuinely cross-cutting
// competencies every trade in section 15's "Ofícios tradicionais" list
// shares before specializing (workspace organization, measuring,
// project planning, tool care, seeing a project through, following
// instructions) -- ten competencies total, matching the granularity of
// the previous two content slices.
//
// Per-trade specialization (marcenaria, carpintaria, jardinagem, costura,
// culinária, mecânica básica, elétrica básica, manutenção residencial,
// artesanato, construção simples, pintura residencial) is explicitly NOT
// covered here, per the task's own instruction: that's future follow-up
// work, one trade at a time, each as its own LearningPath branching off
// this same foundational domain once it exists. Every objective below is
// deliberately trade-neutral -- generic tools/materials/projects, never a
// specific craft -- so this domain stays a genuine prerequisite for any
// future trade path rather than smuggling one trade's content in early.
//
// Age-appropriate framing (matching #95 section 35's child-safety
// principle): every objective assumes adult supervision where a real
// tool or risk is involved, and the "Supervisão e Restrição por Faixa
// Etária" competency exists specifically so age-based limits are an
// explicit, trackable part of this domain rather than an afterthought.

const DOMAIN_CODE = 'TRADES';
const PATH_CODE = 'TRADES.FOUNDATIONS';

export interface TradesFormationDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesFormationPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface TradesFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface TradesFormationSeedData {
  domain: TradesFormationDomainSeed;
  path: TradesFormationPathSeed;
  competencies: TradesFormationCompetencySeed[];
}

export function buildTradesFormationSeedData(): TradesFormationSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Ofícios',
      description:
        'Formação para o trabalho manual e os ofícios tradicionais como disciplina própria -- começando pela base de segurança, uso de ferramentas e método que qualquer ofício exige, antes de qualquer especialização em um ofício tradicional específico (cada um, uma trilha futura e separada, fora do escopo desta fundação).',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Segurança e Ofícios',
      description:
        'Trilha fundamental e neutra quanto ao ofício -- segurança, uso de ferramentas, organização, medição, planejamento e conclusão de projetos -- comum a qualquer ofício tradicional antes de o aluno se especializar em um deles (issue #95 seção 15, subseção "Segurança" mais competências transversais a todos os ofícios).',
    },
    competencies: [
      {
        code: 'TRADES.FOUNDATIONS.TOOL_SAFETY',
        title: 'Uso Seguro de Ferramentas',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['video', 'observation'],
        starterObjectives: [
          'Demonstrar o uso seguro de uma ferramenta manual simples, incluindo como segurar, guardar e transportar com segurança, com supervisão de um adulto responsável',
          'Listar pelo menos três regras de segurança para o uso de ferramentas manuais',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.PPE',
        title: 'Equipamento de Proteção Individual (EPI)',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Identificar e usar corretamente o equipamento de proteção individual apropriado (óculos de proteção, luvas, etc.) durante uma atividade manual supervisionada',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.RISK_AWARENESS',
        title: 'Identificação de Riscos',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['text', 'observation'],
        starterObjectives: [
          'Observar um espaço ou atividade e apontar pelo menos três riscos potenciais antes de começar, propondo como evitar cada um',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.AGE_SUPERVISION',
        title: 'Supervisão e Restrição por Faixa Etária',
        level: 1,
        ageRecommendation: { min: 6, max: 14 },
        evidenceTypes: ['observation', 'text'],
        starterObjectives: [
          'Reconhecer, com apoio de um responsável, quais ferramentas ou atividades exigem supervisão direta de um adulto de acordo com a própria idade',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.WORKSPACE_ORGANIZATION',
        title: 'Organização do Espaço de Trabalho',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Organizar e manter um espaço de trabalho limpo e seguro antes, durante e depois de uma atividade manual',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.MEASURING',
        title: 'Medidas e Leitura de Instrumentos de Medição',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['photo', 'text'],
        starterObjectives: [
          'Medir corretamente um objeto ou espaço usando uma régua, trena ou instrumento de medição apropriado, registrando o resultado',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.PROJECT_PLANNING',
        title: 'Planejamento de Projeto Prático',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['text', 'photo'],
        starterObjectives: [
          'Planejar as etapas de um pequeno projeto manual antes de executá-lo, listando materiais, ferramentas e a sequência de passos',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.TOOL_CARE',
        title: 'Cuidado e Manutenção de Ferramentas',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['photo', 'observation'],
        starterObjectives: [
          'Limpar, guardar e verificar o estado de uma ferramenta simples após o uso, identificando quando ela precisa de manutenção ou substituição',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.PROJECT_COMPLETION',
        title: 'Conclusão de Projeto do Início ao Fim',
        level: 1,
        ageRecommendation: { min: 8, max: 14 },
        evidenceTypes: ['photo', 'video', 'text'],
        starterObjectives: [
          'Concluir um pequeno projeto manual funcional do início ao fim, registrando o processo em portfólio (fotos, vídeo ou descrição)',
        ],
      },
      {
        code: 'TRADES.FOUNDATIONS.INSTRUCTION_FOLLOWING',
        title: 'Leitura e Execução de Instruções',
        level: 1,
        ageRecommendation: { min: 7, max: 14 },
        evidenceTypes: ['observation', 'text'],
        starterObjectives: [
          'Seguir um passo a passo simples (escrito ou em vídeo) para completar uma tarefa manual, identificando quando pedir ajuda',
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

export function buildTradesFormationDomainDto(seed: TradesFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildTradesFormationPathDto(
  seed: TradesFormationPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildTradesFormationCompetencyDto(
  seed: TradesFormationCompetencySeed,
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
