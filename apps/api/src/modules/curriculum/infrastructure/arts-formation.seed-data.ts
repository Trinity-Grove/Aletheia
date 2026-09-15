import {
  createCompetencyDefinitionSchema,
  createLearningDomainSchema,
  createLearningPathSchema,
  type CreateCompetencyDefinitionOutput,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
} from '@aletheia/contracts';

// Issue #95 section 14: visual and performing arts as a first-class domain.
// This foundational slice maps one competency to each enumerated topic and
// keeps the content descriptive and family-neutral. Craft skills that are
// primarily tool/trade training remain under TRADES.CRAFTS.
const DOMAIN_CODE = 'ARTS';
const PATH_CODE = 'ARTS.FOUNDATIONS';

export interface ArtsFormationDomainSeed { code: string; name: string; description: string }
export interface ArtsFormationPathSeed { code: string; name: string; description: string }
export interface ArtsFormationCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}
export interface ArtsFormationSeedData {
  domain: ArtsFormationDomainSeed;
  path: ArtsFormationPathSeed;
  competencies: ArtsFormationCompetencySeed[];
}

export function buildArtsFormationSeedData(): ArtsFormationSeedData {
  const age = { min: 6, max: 16 };
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Artes',
      description: 'Formação artística como área própria, integrando criação, apreciação, repertório e reflexão em linguagens visuais, cênicas, literárias e audiovisuais, sem impor um estilo ou tradição cultural única.',
    },
    path: {
      code: PATH_CODE,
      name: 'Fundamentos de Artes',
      description: 'Trilha introdutória de artes visuais, cênicas, literárias e audiovisuais: experimentar técnicas, observar obras, criar projetos e documentar o processo com segurança e respeito às diferentes culturas.',
    },
    competencies: [
      { code: 'ARTS.FOUNDATIONS.DRAWING', title: 'Desenho', level: 1, ageRecommendation: age, evidenceTypes: ['photo', 'text'], starterObjectives: ['Criar uma composição desenhada observando formas, proporções e linhas, e explicar uma escolha feita durante o processo'] },
      { code: 'ARTS.FOUNDATIONS.PAINTING', title: 'Pintura', level: 1, ageRecommendation: age, evidenceTypes: ['photo', 'text'], starterObjectives: ['Experimentar mistura de cores e diferentes pinceladas em uma pintura própria, registrando materiais e decisões de composição'] },
      { code: 'ARTS.FOUNDATIONS.SCULPTURE', title: 'Escultura', level: 1, ageRecommendation: { min: 8, max: 16 }, evidenceTypes: ['photo', 'observation'], starterObjectives: ['Modelar uma pequena forma tridimensional com material apropriado e descrever como equilíbrio, volume e textura foram resolvidos com supervisão adequada'] },
      { code: 'ARTS.FOUNDATIONS.PHOTOGRAPHY', title: 'Fotografia', level: 1, ageRecommendation: { min: 9, max: 16 }, evidenceTypes: ['photo', 'text'], starterObjectives: ['Produzir uma pequena série de fotografias sobre um tema, escolhendo enquadramento, luz e ponto de vista e respeitando a privacidade das pessoas'] },
      { code: 'ARTS.FOUNDATIONS.THEATER', title: 'Teatro', level: 1, ageRecommendation: { min: 8, max: 16 }, evidenceTypes: ['video', 'observation'], starterObjectives: ['Participar de uma cena curta usando voz, corpo e escuta de grupo, refletindo sobre personagem, espaço e colaboração'] },
      { code: 'ARTS.FOUNDATIONS.LITERATURE', title: 'Literatura', level: 1, ageRecommendation: age, evidenceTypes: ['text', 'audio'], starterObjectives: ['Ler ou ouvir uma obra literária e responder com uma produção própria que identifique personagens, imagens ou ideias relevantes'] },
      { code: 'ARTS.FOUNDATIONS.CRAFTS', title: 'Artesanato', level: 1, ageRecommendation: { min: 6, max: 14 }, evidenceTypes: ['photo', 'observation'], starterObjectives: ['Criar um objeto artesanal combinando materiais e técnicas simples, organizando o espaço e seguindo orientações de segurança'] },
      { code: 'ARTS.FOUNDATIONS.AUDIOVISUAL', title: 'Audiovisual', level: 1, ageRecommendation: { min: 10, max: 16 }, evidenceTypes: ['video', 'text'], starterObjectives: ['Planejar e produzir uma peça audiovisual curta com começo, desenvolvimento e fim, identificando imagem, som e edição usados'] },
      { code: 'ARTS.FOUNDATIONS.ART_HISTORY', title: 'História da Arte', level: 1, ageRecommendation: { min: 9, max: 16 }, evidenceTypes: ['text', 'photo'], starterObjectives: ['Comparar duas obras de épocas ou culturas diferentes, descrevendo materiais, contexto e características observáveis sem hierarquizar uma tradição'] },
      { code: 'ARTS.FOUNDATIONS.ART_PROJECTS', title: 'Projetos Artísticos', level: 1, ageRecommendation: { min: 8, max: 16 }, evidenceTypes: ['photo', 'text', 'observation'], starterObjectives: ['Conceber, executar e revisar um projeto artístico com objetivo, etapas, materiais e registro das mudanças feitas'] },
      { code: 'ARTS.FOUNDATIONS.PORTFOLIO', title: 'Portfólio Artístico', level: 1, ageRecommendation: { min: 8, max: 16 }, evidenceTypes: ['photo', 'text'], starterObjectives: ['Selecionar trabalhos de um período e montar um portfólio que apresente processo, escolhas, revisão e reflexão pessoal sobre o que foi aprendido'] },
    ],
  };
}

export function buildArtsFormationDomainDto(seed: ArtsFormationDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse(seed);
}
export function buildArtsFormationPathDto(seed: ArtsFormationPathSeed, domainId: string): CreateLearningPathOutput {
  return createLearningPathSchema.parse({ ...seed, domainId });
}
export function buildArtsFormationCompetencyDto(seed: ArtsFormationCompetencySeed, domainId: string, pathId: string): CreateCompetencyDefinitionOutput {
  return createCompetencyDefinitionSchema.parse({
    code: seed.code, title: seed.title, level: seed.level, domainId, pathId,
    metadata: { ageRecommendation: seed.ageRecommendation, evidenceTypes: seed.evidenceTypes, starterObjectives: seed.starterObjectives },
  });
}
