export interface OfficialPackSeed {
  code: string;
  name: string;
  description: string;
  metadata: {
    category: string;
    targetStages: string[];
    estimatedLessons: number;
    featured?: boolean;
    pillars?: string[];
  };
}

export const OFFICIAL_CURRICULUM_PACKS: OfficialPackSeed[] = [
  {
    code: 'CLASSICAL_TRIVIUM',
    name: 'Trivium Clássico & Artes Liberais',
    description:
      'Formação clássica estruturada nas três vias do Trivium: Gramática (aquisição da linguagem, vocabulário e memória poética), Lógica (discernimento de argumentos e pensamento crítico) e Retórica (eloquência e comunicação virtuosa com amor à verdade).',
    metadata: {
      category: 'Metodologia Clássica',
      targetStages: ['GRAMÁTICA', 'LÓGICA', 'RETÓRICA'],
      estimatedLessons: 72,
      featured: true,
      pillars: ['Gramática Latina e Vernácula', 'Falácias e Silogismos', 'Composição e Eloquência'],
    },
  },
  {
    code: 'BIBLICAL_WORLDVIEW_FOUNDATIONS',
    name: 'Cosmovisão Bíblica & Fundamentos Cristãos',
    description:
      'Estudo sistemático dos grandes atos da história da redenção: Criação, Queda, Redenção e Consumação. Conecta a fé bíblica com a interpretação de ciências, história, cultura, tecnologia e a missão familiar cristã.',
    metadata: {
      category: 'Formação Espiritual',
      targetStages: ['TODOS'],
      estimatedLessons: 52,
      featured: true,
      pillars: ['Narrativa da Criação', 'Doutrina Cristã Essencial', 'Vida Devocional e Liturgia no Lar'],
    },
  },
  {
    code: 'FAMILY_FINANCE_STEWARDSHIP',
    name: 'Educação Financeira & Mordomia Bíblica',
    description:
      'Princípios de mordomia cristã dos recursos: planejamento financeiro, orçamento familiar, honestidade nos negócios, poupança prudente, fuga de dívidas e generosidade alegre na prática do Reino de Deus.',
    metadata: {
      category: 'Ofícios & Prática',
      targetStages: ['LÓGICA', 'RETÓRICA'],
      estimatedLessons: 28,
      featured: false,
      pillars: ['Orçamento Doméstico', 'Empreendedorismo Familiar', 'Mordomia e Generosidade'],
    },
  },
  {
    code: 'NATURAL_SCIENCES_CREATION',
    name: 'Ciências Naturais & Observação da Criação',
    description:
      'Exploração empírica das maravilhas do mundo natural: botânica, zoologia de campo, meteorologia, astronomia a olho nu e cadernos da natureza, cultivando o encanto e o rigor investigativo do método científico.',
    metadata: {
      category: 'Ciências & Natureza',
      targetStages: ['GRAMÁTICA', 'LÓGICA'],
      estimatedLessons: 60,
      featured: false,
      pillars: ['Diário da Natureza', 'Ciclos Biológicos', 'Observação Celeste'],
    },
  },
  {
    code: 'PRACTICAL_TRADES_WOODWORKING',
    name: 'Ofícios Práticos & Autonomia Doméstica',
    description:
      'Desenvolvimento de habilidades manuais, carpintaria básica, uso seguro de ferramentas, pequenos reparos residenciais, noções de eletricidade e marcenaria para desenvolver autonomia, destreza e diligência.',
    metadata: {
      category: 'Ofícios & Prática',
      targetStages: ['LÓGICA', 'RETÓRICA'],
      estimatedLessons: 36,
      featured: false,
      pillars: ['Segurança com Ferramentas', 'Trabalho em Madeira', 'Manutenção Residencial'],
    },
  },
  {
    code: 'SACRED_MUSIC_APPRECIATION',
    name: 'Música Sacra & Apreciação Musical',
    description:
      'Canto coral, história dos grandes hinos e compositores sacros (Bach, Händel, Watts, Newton), noções elementares de solfejo, teoria musical e cultivo da sensibilidade estética ao que é belo, nobre e verdadeiro.',
    metadata: {
      category: 'Artes & Beleza',
      targetStages: ['TODOS'],
      estimatedLessons: 44,
      featured: false,
      pillars: ['Solfejo e Ritmo', 'Hinologia Histórica', 'Apreciação dos Mestres'],
    },
  },
];
