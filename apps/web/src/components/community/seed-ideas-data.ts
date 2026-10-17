import type { CommunityActivityResponseDto } from '@aletheia/contracts';

export const SEED_IDEAS: CommunityActivityResponseDto[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Diário da Natureza: Coleta e Impressão de Folhas de Outono',
    description:
      'Passeio ao ar livre para observar a transição das estações, coletar folhas caídas de diferentes formatos e criar gravuras com giz de cera e aquarela no caderno da natureza.',
    ageMin: 5,
    ageMax: 12,
    estimatedDurationMinutes: 45,
    supervisionRequired: true,
    riskLevel: 'LOW',
    evidenceRequirementMode: 'ANY',
    metadata: {
      theme: 'NATURE_STUDY',
      materials: ['Caderno de campo sem pauta', 'Giz de cera', 'Lupa', 'Folhas variadas coletadas'],
      isSeed: true,
    },
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Círculo de Leitura Viva: O Vento nos Salgueiros',
    description:
      'Leitura em voz alta de capítulos selecionados do clássico da literatura infantil, seguida por narração oral livre e desenho reflexivo das aventuras à beira do rio.',
    ageMin: 6,
    ageMax: 14,
    estimatedDurationMinutes: 40,
    supervisionRequired: false,
    riskLevel: 'LOW',
    evidenceRequirementMode: 'ANY',
    metadata: {
      theme: 'LIVING_BOOKS',
      materials: ['Livro O Vento nos Salgueiros', 'Papel sulfite ou canson', 'Lápis de cor ou giz pastel'],
      isSeed: true,
    },
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000003',
    name: 'Oficina de Argila: Recipientes e Marcadores Botânicos',
    description:
      'Modelagem manual com argila natural ou massa de secagem ao ar, gravando texturas de galhos e flores para criar pequenos pratos e marcadores de plantas.',
    ageMin: 4,
    ageMax: 15,
    estimatedDurationMinutes: 60,
    supervisionRequired: true,
    riskLevel: 'LOW',
    evidenceRequirementMode: 'ANY',
    metadata: {
      theme: 'HANDICRAFT',
      materials: ['Argila para modelagem ou massa cerâmica', 'Raminhos de alecrim e folhas secas', 'Espátulas de madeira ou palitos'],
      isSeed: true,
    },
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000004',
    name: 'Linha do Tempo Viva: As Estações e Tradições Familiares',
    description:
      'Construção de um rolo contínuo de papel para registrar acontecimentos marcantes da família ao longo do ano, integrando datas históricas e observações astronômicas simples.',
    ageMin: 7,
    ageMax: 16,
    estimatedDurationMinutes: 50,
    supervisionRequired: true,
    riskLevel: 'LOW',
    evidenceRequirementMode: 'ANY',
    metadata: {
      theme: 'SEASONAL_HISTORY',
      materials: ['Rolo de papel pardo ou kraft', 'Fita métrica', 'Canetinhas hidrográficas', 'Fotos ou recortes impressos'],
      isSeed: true,
    },
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000005',
    name: 'Horta em Família: Cultivo e Observação de Ervas Aromáticas',
    description:
      'Plantio de mudas ou sementes de manjericão, alecrim e hortelã em vasos reutilizados, acompanhando o ciclo de rega, crescimento e uso culinário nas refeições da casa.',
    ageMin: 3,
    ageMax: 12,
    estimatedDurationMinutes: 35,
    supervisionRequired: true,
    riskLevel: 'LOW',
    evidenceRequirementMode: 'ANY',
    metadata: {
      theme: 'FAMILY_PROJECTS',
      materials: ['Vasos pequenos ou garrafas cortadas', 'Terra adubada', 'Mudas ou sementes de ervas', 'Pequeno regador'],
      isSeed: true,
    },
    createdAt: '2026-10-16T00:00:00.000Z',
    updatedAt: '2026-10-16T00:00:00.000Z',
  },
];
