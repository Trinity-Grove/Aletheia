import {
  createTheologicalTraditionDefinitionSchema,
  type CreateTheologicalTraditionDefinitionOutput,
} from '@aletheia/contracts';

export interface TheologicalTraditionSeedRow {
  code: string;
  name: string;
  description: string;
  metadata: Record<string, unknown>;
}

export const BASE_THEOLOGICAL_TRADITION_SEED_ROWS: TheologicalTraditionSeedRow[] = [
  {
    code: 'BAPTIST',
    name: 'Batista',
    description:
      'Ênfase no sacerdócio universal de todos os crentes, batismo bíblico por imersão de professantes, autoridade suprema das Escrituras, liberdade de consciência e autonomia da igreja local.',
    metadata: {
      historicalConfessions: [
        'Primeira Confissão de Londres (1644)',
        'Segunda Confissão de Londres (1689)',
        'Declaração de Fé da Convenção Batista Brasileira (1986)',
      ],
      emphasis: [
        'Sacerdócio universal dos crentes',
        'Batismo bíblico de crentes por imersão',
        'Liberdade religiosa e de consciência',
        'Autonomia da igreja local',
      ],
    },
  },
  {
    code: 'REFORMED_PRESBYTERIAN',
    name: 'Presbiteriana e Reformada',
    description:
      'Ênfase na absoluta soberania de Deus na salvação e criação, teologia pactual (aliança da graça), governo representativo presbiterial e fidelidade às confissões históricas da Reforma.',
    metadata: {
      historicalConfessions: [
        'Confissão de Fé de Westminster (1646)',
        'Catecismo Maior e Breve de Westminster',
        'Três Formas de Unidade (Confissão Belga, Catecismo de Heidelberg, Cânones de Dort)',
      ],
      emphasis: [
        'Soberania de Deus em todas as esferas',
        'Teologia da Aliança (Pacto da Graça)',
        'Cinco Solas da Reforma Protestante',
      ],
    },
  },
  {
    code: 'LUTHERAN',
    name: 'Luterana',
    description:
      'Herança direta da Reforma de Wittenberg, com ênfase central na justificação pela graça mediante a fé, correta distinção bíblica entre Lei e Evangelho, centralidade da Palavra e Sacramentos e Teologia da Cruz.',
    metadata: {
      historicalConfessions: [
        'Confissão de Augsburgo (1530)',
        'Catecismo Menor e Maior de Martinho Lutero (1529)',
        'Livro de Concórdia (1580)',
      ],
      emphasis: [
        'Justificação somente pela graça e fé (Sola Gratia, Sola Fide)',
        'Distinção entre Lei e Evangelho',
        'Teologia da Cruz e eficácia dos Sacramentos',
      ],
    },
  },
  {
    code: 'ANGLICAN',
    name: 'Anglicana e Episcopal Reformada',
    description:
      'Tradição histórica que une fidelidade doutrinária reformada e bíblica à rica herança litúrgica patrística e apostólica, expressa no Livro de Oração Comum e nos Trinta e Nove Artigos de Religião.',
    metadata: {
      historicalConfessions: [
        'Trinta e Nove Artigos de Religião (1563)',
        'Livro de Oração Comum (1662)',
        'Quadrilátero de Chicago-Lambeth (1888)',
      ],
      emphasis: [
        'Liturgia histórica e oração comunitária',
        'Via Media confessional reformada',
        'Herança apostólica e patrística',
      ],
    },
  },
  {
    code: 'METHODIST_WESLEYAN',
    name: 'Metodista e Wesleyana',
    description:
      'Ênfase na graça preveniente de Deus para todos, santidade bíblica no coração e na conduta diária, evangelização ativa, piedade prática e no Quadrilátero Wesleyano (Escritura, Tradição, Razão e Experiência).',
    metadata: {
      historicalConfessions: [
        'Vinte e Cinco Artigos de Religião (1784)',
        'Sermões Padrão de John Wesley',
        'Notas Explicativas sobre o Novo Testamento',
      ],
      emphasis: [
        'Graça preveniente, justificadora e santificadora',
        'Santidade prática e amor cristão ativo',
        'Quadrilátero Wesleyano',
      ],
    },
  },
  {
    code: 'PENTECOSTAL',
    name: 'Pentecostal e Carismática',
    description:
      'Ênfase na contemporaneidade de todos os dons do Espírito Santo, no batismo no Espírito Santo como capacitação para o testemunho cristão, na oração fervorosa e no evangelismo dinâmico.',
    metadata: {
      historicalConfessions: [
        'Declaração de Fé das Assembleias de Deus e denominações pentecostais clássicas',
      ],
      emphasis: [
        'Atualidade dos dons do Espírito Santo para hoje',
        'Batismo no Espírito Santo e unção capacitadora',
        'Vida de oração fervorosa e evangelismo ativo',
      ],
    },
  },
  {
    code: 'CONGREGATIONAL',
    name: 'Congregacional',
    description:
      'Tradição puritana e evangélica histórica com governo eclesiástico autônomo em cada congregação local unida por aliança solene de membros, com forte raiz no avivamento evangélico e no pioneirismo missionário.',
    metadata: {
      historicalConfessions: [
        'Declaração de Savoy (1658)',
        '28 Artigos Breves de Fé das Igrejas Evangélicas Congregacionais (1876)',
      ],
      emphasis: [
        'Autonomia e democracia da igreja local',
        'Aliança comunitária voluntária de membros',
        'Zelo evangelístico e missões',
      ],
    },
  },
  {
    code: 'DISPENSATIONAL',
    name: 'Aliancista e Dispensacionalista',
    description:
      'Abordagem hermenêutica que destaca a administração progressiva dos propósitos soberanos de Deus ao longo de diferentes dispensações bíblicas, com distinção profética entre a Igreja e Israel.',
    metadata: {
      historicalConfessions: [
        'Bíblia Anotada de Scofield',
        'Declaração Doutrinária do Seminário Teológico de Dallas',
      ],
      emphasis: [
        'Interpretação bíblica literal, gramatical e histórica',
        'Distinção dispensacional progressiva e escatológica',
        'Esperança bendita da volta de Cristo',
      ],
    },
  },
  {
    code: 'NON_DENOMINATIONAL',
    name: 'Cristã Geral e Não-Denominacional',
    description:
      'Foco no cristianismo histórico essencial e nos consensos fundamentais da fé cristã expressos nos Credos Ecumênicos universais (Apostólico e Niceno-Constantinopolitano), sem vinculação denominacional exclusiva.',
    metadata: {
      historicalConfessions: [
        'Credo dos Apóstolos',
        'Credo Niceno-Constantinopolitano (381)',
        'Consenso Evangélico Fundamental (Lausanne)',
      ],
      emphasis: [
        'Fundamentos essenciais da fé bíblica compartilhada',
        'Unidade no corpo de Cristo e fraternidade cristã',
        'Liberdade consciente em questões teológicas secundárias',
      ],
    },
  },
];

export function buildTheologicalTraditionSeedRows(): CreateTheologicalTraditionDefinitionOutput[] {
  return BASE_THEOLOGICAL_TRADITION_SEED_ROWS.map((row) =>
    createTheologicalTraditionDefinitionSchema.parse({
      code: row.code,
      name: row.name,
      description: row.description,
      metadata: row.metadata,
      version: 1,
      status: 'PUBLISHED',
      schemaVersion: '1.0.0',
    }),
  );
}
