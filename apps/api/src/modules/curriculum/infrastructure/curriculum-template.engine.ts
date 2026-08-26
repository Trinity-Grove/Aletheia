import { Injectable } from '@nestjs/common';
import type { PedagogicalFramework } from '@aletheia/contracts';

export interface TemplateSubjectDefinition {
  name: string;
  color: string;
  icon?: string;
  description: string;
  starterObjectives: string[];
}

@Injectable()
export class CurriculumTemplateEngine {
  getTemplateDefinitions(framework: PedagogicalFramework): TemplateSubjectDefinition[] {
    switch (framework) {
      case 'CLASSICAL_TRIVIUM':
        return [
          {
            name: 'Língua Portuguesa (Gramática & Redação)',
            color: '#2563EB',
            icon: 'book-open',
            description: 'Estrutura gramatical, ortografia, pontuação, vocabulário e exercícios de cópia e narração.',
            starterObjectives: [
              'Dominar classes gramaticais fundamentais (substantivo, adjetivo, verbo)',
              'Praticar cópia e ditado diário com pontuação correta',
              'Realizar narração oral de contos e parábolas clássicas',
            ],
          },
          {
            name: 'Latim & Línguas Clássicas',
            color: '#7C3AED',
            icon: 'scroll',
            description: 'Vocabulário latino básico, declinações e etimologia de raízes ocidentais.',
            starterObjectives: [
              'Memorizar primeira e segunda declinações latinas',
              'Aprender 50 palavras raízes latinas e seus derivados em português',
            ],
          },
          {
            name: 'Matemática & Aritmética Lógica',
            color: '#059669',
            icon: 'calculator',
            description: 'Cálculo mental, quatro operações fundamentais, frações e resolução lógica de problemas.',
            starterObjectives: [
              'Dominar fluência na tabuada de multiplicação (1 ao 10)',
              'Resolver problemas aritméticos de múltiplas etapas com raciocínio lógico',
            ],
          },
          {
            name: 'História Ocidental & Antiga',
            color: '#D97706',
            icon: 'landmark',
            description: 'Linha do tempo cronológica da Antiguidade, Grécia, Roma e História Sagrada.',
            starterObjectives: [
              'Construir livro dos séculos com marcos do Mundo Antigo',
              'Compreender a cronologia dos patriarcas, impérios egípcio e romano',
            ],
          },
          {
            name: 'Ciências Naturais & Observação',
            color: '#0D9488',
            icon: 'microscope',
            description: 'Taxonomia básica, reino vegetal e animal, estações do ano e corpos celestes.',
            starterObjectives: [
              'Classificar seres vivos por reinos e características observáveis',
              'Identificar as principais constelações e movimentos terrestres',
            ],
          },
          {
            name: 'Literatura Clássica & Poesia',
            color: '#DB2777',
            icon: 'feather',
            description: 'Leitura em voz alta de grandes obras, fábulas de Esopo e recitação poética.',
            starterObjectives: [
              'Recitar poemas clássicos de memória com expressividade',
              'Ler e debater fábulas e mitologias formativas',
            ],
          },
        ];

      case 'CHARLOTTE_MASON':
        return [
          {
            name: 'Estudo da Natureza (Nature Study)',
            color: '#16A34A',
            icon: 'leaf',
            description: 'Caderno de natureza com desenhos botânicos, observação ao ar livre e hábitos da fauna.',
            starterObjectives: [
              'Manter diário de natureza com ilustrações semanais e anotações de campo',
              'Identificar 10 espécies de árvores e pássaros nativos da região',
            ],
          },
          {
            name: 'Livros Vivos (Living Books) & Narração',
            color: '#9333EA',
            icon: 'book',
            description: 'Educação através de biografias ricas e narração imediata de cada capítulo lido.',
            starterObjectives: [
              'Realizar narrações orais estruturadas após leituras em voz alta',
              'Leitura de biografias de figuras históricas e cientistas exemplares',
            ],
          },
          {
            name: 'Apreciação de Arte & Música (Picture Study)',
            color: '#E11D48',
            icon: 'palette',
            description: 'Estudo detalhado de pintores mestres a cada período e escuta atenta de compositores.',
            starterObjectives: [
              'Estudar obras e técnica de um grande pintor clássico',
              'Apreciação e identificação de temas em peças de música erudita',
            ],
          },
          {
            name: 'Trabalhos Manuais & Habilidades Práticas',
            color: '#CA8A04',
            icon: 'scissors',
            description: 'Artesanato útil, marcenaria básica, bordado, culinária e cuidados com o lar.',
            starterObjectives: [
              'Desenvolver e concluir um projeto artesanal funcional',
              'Aprender técnicas de costura básica e manutenção de ferramentas',
            ],
          },
          {
            name: 'Hábito & Formação de Caráter',
            color: '#0891B2',
            icon: 'heart',
            description: 'Desenvolvimento de virtudes como atenção, ordem, pontualidade e perseverança.',
            starterObjectives: [
              'Cultivar o hábito da atenção focada em lições breves e intensas',
              'Praticar ordem e zelo na organização dos próprios materiais',
            ],
          },
        ];

      case 'TRADITIONAL':
      default:
        return [
          {
            name: 'Língua Portuguesa',
            color: '#2563EB',
            icon: 'book',
            description: 'Compreensão de texto, ortografia, redação e gramática normativa.',
            starterObjectives: [
              'Desenvolver leitura fluente e interpretação de textos de complexidade adequada',
              'Produzir redações estruturadas com início, meio e conclusão',
            ],
          },
          {
            name: 'Matemática',
            color: '#059669',
            icon: 'calculator',
            description: 'Aritmética, raciocínio quantitativo, medidas e geometria introdutória.',
            starterObjectives: [
              'Executar operações aritméticas básicas com exatidão e velocidade',
              'Compreender frações, decimais e porcentagens em situações cotidianas',
            ],
          },
          {
            name: 'História',
            color: '#D97706',
            icon: 'landmark',
            description: 'História do Brasil e marcos fundamentais da civilização.',
            starterObjectives: [
              'Conhecer os períodos fundamentais da História do Brasil',
              'Identificar causas e impactos das grandes navegações e colonização',
            ],
          },
          {
            name: 'Geografia',
            color: '#0D9488',
            icon: 'globe',
            description: 'Relevo, clima, cartografia, regiões brasileiras e geopolítica mundial.',
            starterObjectives: [
              'Localizar continentes, oceanos e estados brasileiros no mapa',
              'Compreender os biomas brasileiros e recursos hídricos',
            ],
          },
          {
            name: 'Ciências',
            color: '#16A34A',
            icon: 'flask',
            description: 'Biologia, corpo humano, química básica e ecologia.',
            starterObjectives: [
              'Descrever os principais sistemas do corpo humano e hábitos saudáveis',
              'Compreender o ciclo da água, estados físicos da matéria e cadeias alimentares',
            ],
          },
        ];
    }
  }
}
