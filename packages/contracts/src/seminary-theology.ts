import { z } from 'zod';

export const SEMINARY_EVIDENCE_TYPE_CODES = [
  'THEOLOGICAL_ESSAY',
  'EXEGESIS_PAPER',
  'BOOK_REVIEW',
  'ORAL_DEFENSE',
  'THEOLOGICAL_DEBATE',
] as const;

export const SeminaryEvidenceTypeCodeSchema = z.enum(SEMINARY_EVIDENCE_TYPE_CODES);
export type SeminaryEvidenceTypeCode = z.infer<typeof SeminaryEvidenceTypeCodeSchema>;

export const SeminaryRubricCriterionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().min(0).max(1),
  description: z.string().optional(),
});
export type SeminaryRubricCriterion = z.infer<typeof SeminaryRubricCriterionSchema>;

export const SeminaryTheologyRubricSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  criteria: z.array(SeminaryRubricCriterionSchema).min(1),
});
export type SeminaryTheologyRubric = z.infer<typeof SeminaryTheologyRubricSchema>;

export const SEMINARY_THEOLOGY_RUBRIC_DEFINITION: SeminaryTheologyRubric = {
  code: 'THEOLOGY_ACADEMIC_RIGOR_RUBRIC',
  name: 'Rubrica de Rigor Teológico e Exegético',
  description: 'Avaliação analítica de produções teológicas acadêmicas com 4 critérios ponderados',
  criteria: [
    {
      code: 'EXEGETICAL_DEPTH',
      name: 'Fidelidade Exegética',
      weight: 0.3,
      description: 'Análise do texto bíblico no contexto histórico-gramatical e canônico com uso de línguas originais',
    },
    {
      code: 'SYSTEMATIC_COHERENCE',
      name: 'Coerência Sistemática',
      weight: 0.25,
      description: 'Articulação lógica e orgânica das doutrinas sem contradições internas',
    },
    {
      code: 'HISTORICAL_AWARENESS',
      name: 'Consciência Histórica e Patrística',
      weight: 0.25,
      description: 'Citação direta de credos, concílios e fontes primárias históricas',
    },
    {
      code: 'ARGUMENTATIVE_RIGOR',
      name: 'Rigor Argumentativo e Caridade',
      weight: 0.2,
      description: 'Estrutura formal, bibliografia e princípio da caridade hermenêutica',
    },
  ],
};

export const SEMINARY_THEOLOGY_COMPETENCIES = [
  // Ciclo I
  'THEO.ADV.BIBLIOLOGY_CANON',
  'THEO.ADV.HERMENEUTICS',
  'THEO.ADV.STRUCTURED_EXEGESIS',
  'THEO.ADV.REDEMPTION_BIBLICAL_THEOLOGY',
  // Ciclo II
  'THEO.ADV.THEOLOGY_PROPER_TRINITY',
  'THEO.ADV.THEOLOGICAL_ANTHROPOLOGY',
  'THEO.ADV.HAMARTIOLOGY',
  'THEO.ADV.CHRISTOLOGY_HYPOSTATIC_UNION',
  'THEO.ADV.PNEUMATOLOGY',
  'THEO.ADV.ANGELOLOGY_DEMONOLOGY',
  // Ciclo III
  'THEO.ADV.SOTERIOLOGY',
  'THEO.ADV.ECCLESIOLOGY_SACRAMENTS',
  'THEO.ADV.ESCHATOLOGY_MILLENNIUM',
  'THEO.ADV.APOCALYPSE_MODELS',
  'THEO.ADV.ESCHATOLOGY_INDIVIDUAL_GENERAL',
  // Ciclo IV
  'THEO.ADV.PATRISTICS',
  'THEO.ADV.HISTORIC_COUNCILS',
  'THEO.ADV.PROTESTANT_REFORMATION',
  'THEO.ADV.DENOMINATIONAL_HISTORY',
  'THEO.ADV.HISTORICAL_THEOLOGY',
  'THEO.ADV.CHRISTIAN_APOLOGETICS',
  'THEO.ADV.PHILOSOPHY_OF_RELIGION',
  'THEO.ADV.CHRISTIAN_ETHICS',
  'THEO.ADV.MISSIOLOGY',
] as const;

export const SeminaryCompetencyCodeSchema = z.enum(SEMINARY_THEOLOGY_COMPETENCIES);
export type SeminaryCompetencyCode = z.infer<typeof SeminaryCompetencyCodeSchema>;

export const SeminaryDisciplineSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  cycle: z.number().int().min(1).max(4),
  competencyCode: SeminaryCompetencyCodeSchema,
  description: z.string(),
  topics: z.array(z.string()).min(1),
  primaryReadings: z.array(z.string()).default([]),
  suggestedEvidenceTypes: z.array(SeminaryEvidenceTypeCodeSchema).default([]),
});
export type SeminaryDiscipline = z.infer<typeof SeminaryDisciplineSchema>;

export const SeminaryCycleSchema = z.object({
  cycle: z.number().int().min(1).max(4),
  name: z.string().min(1),
  description: z.string(),
  disciplines: z.array(SeminaryDisciplineSchema).min(1),
});
export type SeminaryCycle = z.infer<typeof SeminaryCycleSchema>;

export const SeminaryTheologyPackPayloadSchema = z.object({
  code: z.literal('ADVANCED_SEMINARY_THEOLOGY'),
  name: z.string(),
  description: z.string(),
  cycles: z.array(SeminaryCycleSchema).length(4),
});
export type SeminaryTheologyPackPayload = z.infer<typeof SeminaryTheologyPackPayloadSchema>;

export const SEMINARY_DISCIPLINES_METADATA: SeminaryDiscipline[] = [
  // Ciclo I: Fundamentos & Método (Bíblia, Hermenêutica & Exegese)
  {
    code: 'THEO.ADV.BIBLIOLOGY_CANON',
    name: 'Bibliologia & Cânon',
    cycle: 1,
    competencyCode: 'THEO.ADV.BIBLIOLOGY_CANON',
    description: 'Revelação geral e especial, inspiração verbal e plenária, inerrância, autoridade, formação do cânon do AT e NT e história da transmissão textual (crítica textual bíblica).',
    topics: [
      'Revelação geral e especial',
      'Inspiração verbal e plenária, inerrância e autoridade bíblica',
      'Formação do cânon do Antigo e Novo Testamento',
      'História da transmissão dos manuscritos e crítica textual bíblica',
    ],
    primaryReadings: [
      'Confissão de Fé de Westminster (Capítulo I - Da Escritura Sagrada)',
      'B. B. Warfield - The Inspiration and Authority of the Bible',
      'F. F. Bruce - The Canon of Scripture',
      'Bruce Metzger - The Text of the New Testament',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW'],
  },
  {
    code: 'THEO.ADV.HERMENEUTICS',
    name: 'Hermenêutica Bíblica',
    cycle: 1,
    competencyCode: 'THEO.ADV.HERMENEUTICS',
    description: 'Princípios de interpretação gramático-histórica, sensus literalis, analogia da fé, tipologia bíblica e identificação de gêneros literários (narrativa, profecia, sabedoria, epístola, apocalíptico).',
    topics: [
      'Método gramático-histórico e o sentido literal (sensus literalis)',
      'Analogia da fé e analogia da Escritura',
      'Tipologia bíblica e sensus plenior',
      'Gêneros literários bíblicos: narrativa, profecia, poesia, sabedoria, epístola e apocalíptico',
    ],
    primaryReadings: [
      'Milton S. Terry - Biblical Hermeneutics',
      'Gordon Fee & Douglas Stuart - How to Read the Bible for All Its Worth',
      'Agostinho de Hipona - De Doctrina Christiana (A Doutrina Cristã)',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'EXEGESIS_PAPER'],
  },
  {
    code: 'THEO.ADV.STRUCTURED_EXEGESIS',
    name: 'Exegese Bíblica Estruturada',
    cycle: 1,
    competencyCode: 'THEO.ADV.STRUCTURED_EXEGESIS',
    description: 'Método exegético em 7 passos: delimitação textual, contextualização histórica, análise sintática/morfológica, análise léxica em línguas originais, teologia bíblica da passagem e aplicação expositiva.',
    topics: [
      'Delimitação de perícope e crítica textual aplicada',
      'Análise do contexto histórico-cultural e autoria',
      'Análise sintática, morfológica e gramatical no Hebraico/Aramaico/Grego',
      'Análise léxico-semântica e prevenção de falácias exegéticas',
      'Teologia bíblica da passagem e teologia do autor',
      'Síntese exegética e proposição homilética',
    ],
    primaryReadings: [
      'Gordon D. Fee - New Testament Exegesis: A Handbook for Students and Pastors',
      'Douglas Stuart - Old Testament Exegesis: A Primer for Students and Pastors',
      'D. A. Carson - Exegetical Fallacies (Falácias Exegéticas)',
    ],
    suggestedEvidenceTypes: ['EXEGESIS_PAPER', 'ORAL_DEFENSE'],
  },
  {
    code: 'THEO.ADV.REDEMPTION_BIBLICAL_THEOLOGY',
    name: 'Teologia Bíblica da Redenção',
    cycle: 1,
    competencyCode: 'THEO.ADV.REDEMPTION_BIBLICAL_THEOLOGY',
    description: 'História progressiva da revelação e continuidade/descontinuidade das alianças (Adâmica, Noética, Abraâmica, Mosaica, Davídica e Nova Aliança em Cristo).',
    topics: [
      'História da salvação (Heilsgeschichte) e revelação orgânica progressiva',
      'Estrutura das alianças bíblicas: Adâmica, Noética e Abraâmica',
      'Aliança Mosaica e Sinai: lei, sacerdócio e tipologia',
      'Aliança Davídica e a expectativa messiânica',
      'A Nova Aliança consumada em Jesus Cristo',
      'Continuidade e descontinuidade entre os testamentos',
    ],
    primaryReadings: [
      'Geerhardus Vos - Biblical Theology: Old and New Testaments',
      'O. Palmer Robertson - The Christ of the Covenants',
      'Graeme Goldsworthy - Gospel and Kingdom',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'THEOLOGICAL_DEBATE'],
  },

  // Ciclo II: Teologia Sistemática I (Deus, Criação, Queda e Salvação)
  {
    code: 'THEO.ADV.THEOLOGY_PROPER_TRINITY',
    name: 'Teologia Própria (Deus & Trindade)',
    cycle: 2,
    competencyCode: 'THEO.ADV.THEOLOGY_PROPER_TRINITY',
    description: 'A essência de Deus, atributos incomunicáveis e comunicáveis, teologia trinitária clássica (Relações de Origem, Paternidade, Filiação, Processão) e decretos divinos.',
    topics: [
      'A existência e auto-revelação de Deus: aseidade e simplicidade divina',
      'Atributos incomunicáveis: eternidade, imutabilidade, infinitude, onipresença',
      'Atributos comunicáveis: santidade, justiça, amor, misericórdia, verdade',
      'Teologia trinitária clássica: substância/essência (ousia) e pessoas/hipóstases',
      'Relações eternas de origem: paternidade, geração eterna do Filho, processão do Espírito',
      'Decretos divinos, soberania e providência',
    ],
    primaryReadings: [
      'Agostinho de Hipona - De Trinitate (A Trindade)',
      'Tomás de Aquino - Summa Theologiae (Tratado sobre Deus Uno e Trino)',
      'João Calvino - Institutas da Religião Cristã (Livro I)',
      'Herman Bavinck - Reformed Dogmatics: Volume 2, God and Creation',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW'],
  },
  {
    code: 'THEO.ADV.THEOLOGICAL_ANTHROPOLOGY',
    name: 'Antropologia Teológica',
    cycle: 2,
    competencyCode: 'THEO.ADV.THEOLOGICAL_ANTHROPOLOGY',
    description: 'A criação do ser humano à imagem e semelhança de Deus (imago Dei), constituição humana (dicotomia/tricotomia, monismo holístico), aliança de obras e dignidade humana.',
    topics: [
      'Origem da humanidade e criação ex nihilo',
      'A Imago Dei: definições substantiva, relacional e funcional',
      'Constituição ontológica humana: dicotomia, tricotomia e unidade psicossomática',
      'O homem em estado de inocência original e a Aliança de Obras',
      'Dignidade intrínseca da vida humana e igualdade ontológica',
    ],
    primaryReadings: [
      'Agostinho de Hipona - A Cidade de Deus (Livros XII-XIV)',
      'João Calvino - Institutas da Religião Cristã (Livro I, Cap. 15; Livro II, Caps. 1-2)',
      'Anthony Hoekema - Created in God’s Image',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW'],
  },
  {
    code: 'THEO.ADV.HAMARTIOLOGY',
    name: 'Hamartiologia',
    cycle: 2,
    competencyCode: 'THEO.ADV.HAMARTIOLOGY',
    description: 'A origem e essência do pecado, queda histórica, pecado original (culpa imputada vs corrupção herdada), transgressão e seus efeitos no cosmos e na sociedade.',
    topics: [
      'Origem do mal moral e a tentação histórica no Éden',
      'Essência do pecado: incredulidade, autonomia e rebelião contra a lei de Deus',
      'Pecado original: transmissão da culpa (imputação) e corrupção total',
      'Depravação total e incapacidade humana para a auto-salvação',
      'Efeitos cósmicos, sociais e institucionais da queda',
    ],
    primaryReadings: [
      'Agostinho de Hipona - De Natura et Gratia (Da Natureza e da Graça)',
      'Jonathan Edwards - The Great Christian Doctrine of Original Sin Defended',
      'Cornelius Plantinga Jr. - Not the Way It’s Supposed to Be: A Breviary of Sin',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'EXEGESIS_PAPER'],
  },
  {
    code: 'THEO.ADV.CHRISTOLOGY_HYPOSTATIC_UNION',
    name: 'Cristologia & União Hipostática',
    cycle: 2,
    competencyCode: 'THEO.ADV.CHRISTOLOGY_HYPOSTATIC_UNION',
    description: 'A divindade e humanidade plenas de Jesus Cristo, as decisões de Calcedônia, a comunicação de propriedades (communicatio idiomatum), estados de humilhação e exaltação, e as teorias históricas da expiação.',
    topics: [
      'A pré-existência eterna do Logos e divindade de Cristo',
      'A encarnação e a concepção virginal: humanidade plena e impecabilidade',
      'A Definição de Calcedônia (451 d.C.): duas naturezas sem confusão, divisão, separação ou alteração',
      'A comunicação de propriedades (communicatio idiomatum)',
      'Estados de Cristo: humilhação e exaltação',
      'Teorias históricas da expiação: Christus Victor, Satisfação, Penal Substitutiva, Governamental, Moral',
      'Os três ofícios de Cristo: Profeta, Sacerdote e Rei (Munus Triplex)',
    ],
    primaryReadings: [
      'Atanásio de Alexandria - De Incarnatione Verbi Dei (Sobre a Encarnação do Verbo)',
      'Anselmo de Cantuária - Cur Deus Homo (Por que Deus se fez homem)',
      'Definição Calcedoniana (451 d.C.)',
      'B. B. Warfield - The Person and Work of Christ',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW', 'ORAL_DEFENSE'],
  },
  {
    code: 'THEO.ADV.PNEUMATOLOGY',
    name: 'Pneumatologia',
    cycle: 2,
    competencyCode: 'THEO.ADV.PNEUMATOLOGY',
    description: 'A pessoa, divindade e eternidade do Espírito Santo, sua ação na criação, na iluminação bíblica, na ordem da salvação (ordo salutis) e na concessão de dons e frutos.',
    topics: [
      'Personalidade, divindade e eternidade do Espírito Santo',
      'A controvérsia do Filioque e a processão do Espírito',
      'O Espírito Santo no Antigo Testamento e na vida de Jesus',
      'O Espírito na regeneração, habitação, selagem e união com Cristo',
      'A santificação, os frutos do Espírito e o discernimento dos dons espirituais',
      'Cessacionismo e Continuísmo: perspectivas comparadas com caridade intelectual',
    ],
    primaryReadings: [
      'Basílio de Cesareia - De Spiritu Sancto (Sobre o Espírito Santo)',
      'John Owen - The Holy Spirit (Pneumatologia)',
      'Abraham Kuyper - The Work of the Holy Spirit',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'THEOLOGICAL_DEBATE'],
  },
  {
    code: 'THEO.ADV.ANGELOLOGY_DEMONOLOGY',
    name: 'Angelologia & Demonologia',
    cycle: 2,
    competencyCode: 'THEO.ADV.ANGELOLOGY_DEMONOLOGY',
    description: 'Criação, ordem e ministério dos anjos; queda angélica, natureza dos poderes caídos, discernimento espiritual bíblico e soberania de Deus sobre o mundo espiritual invisível.',
    topics: [
      'Criação, natureza e classes dos seres angelicais (querubins, serafins, arcanjos)',
      'Ministério dos santos anjos na história da redenção',
      'A queda dos anjos e a rebelião de Satanás',
      'A natureza dos poderes caídos, demônios e discernimento bíblico',
      'A soberania de Deus e a vitória definitiva de Cristo na cruz sobre os principados e potestades',
    ],
    primaryReadings: [
      'Tomás de Aquino - Summa Theologiae (Tratado sobre os Anjos)',
      'C. S. Lewis - Cartas de um Diabo a seu Aprendiz (The Screwtape Letters)',
      'William Gurnall - The Christian in Complete Armour',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW'],
  },

  // Ciclo III: Teologia Sistemática II (Igreja & Escatologia Completa)
  {
    code: 'THEO.ADV.SOTERIOLOGY',
    name: 'Soteriologia (Graça, Eleição e Aliança)',
    cycle: 3,
    competencyCode: 'THEO.ADV.SOTERIOLOGY',
    description: 'A aplicação da redenção na ordo salutis: eleição, chamado eficaz, regeneração, conversão, justificação pela fé, adoção, santificação progressiva, perseverança e glorificação.',
    topics: [
      'A Aliança da Graça e a base trinitária da redenção',
      'Eleição e Predestinação: visões Reformada, Armínio-Wesleyana e Luterana',
      'Vocação eficaz e regeneração soberana',
      'Fé salvadora, arrependimento para a vida e conversão',
      'Justificação pela fé somente (Sola Fide) e a imputação da justiça de Cristo',
      'Adoção filial e a união mística com Cristo',
      'Santificação progressiva, perseverança dos santos e glorificação',
    ],
    primaryReadings: [
      'Cânones de Dort (1619)',
      'John Wesley - Sermões Padrões (A Salvação pela Fé, Justificação pela Fé)',
      'Martinho Lutero - O Cativeiro Babilônico da Igreja / Da Liberdade do Cristão',
      'John Murray - Redemption Accomplished and Applied',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'THEOLOGICAL_DEBATE', 'EXEGESIS_PAPER'],
  },
  {
    code: 'THEO.ADV.ECCLESIOLOGY_SACRAMENTS',
    name: 'Eclesiologia & Sacramentos',
    cycle: 3,
    competencyCode: 'THEO.ADV.ECCLESIOLOGY_SACRAMENTS',
    description: 'A natureza e marcas da Igreja de Cristo (Una, Sancta, Catholica, Apostolica), formas de governo eclesiástico, sacramentos e ordenanças.',
    topics: [
      'A natureza ontológica da Igreja: povo de Deus, corpo de Cristo e templo do Espírito',
      'Igreja invisível e visível',
      'As marcas da verdadeira igreja (Notae Ecclesiae): Palavra, sacramentos e disciplina',
      'Governo eclesiástico comparado: episcopal, presbiteriano e congregacional',
      'Sacramentos/Ordenanças: natureza como sinais e selos da aliança',
      'O Batismo: pedobatismo aliancista vs credobatismo confessional',
      'A Ceia do Senhor: visões da Transubstanciação, Consubstanciação, Presença Real Espiritual e Memorialismo',
    ],
    primaryReadings: [
      'Cipriano de Cartago - De Ecclesiae Catholicae Unitate (Sobre a Unidade da Igreja)',
      'João Calvino - Institutas da Religião Cristã (Livro IV, Caps. 1-3, 14-17)',
      'Confissão de Fé Batista de Londres de 1689 (Capítulos 26 a 30)',
      'Edmund Clowney - The Church',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW', 'THEOLOGICAL_DEBATE'],
  },
  {
    code: 'THEO.ADV.ESCHATOLOGY_MILLENNIUM',
    name: 'Escatologia Comparada (As 4 Escolas Milenistas)',
    cycle: 3,
    competencyCode: 'THEO.ADV.ESCHATOLOGY_MILLENNIUM',
    description: 'Exame sistemático e exegético das 4 escolas de interpretação milenista de Apocalipse 20: Pré-Milenismo Histórico, Pré-Milenismo Dispensacionalista, Amilenismo e Pós-Milenismo.',
    topics: [
      'A hermenêutica das profecias veterotestamentárias e apocalípticas',
      'Pré-Milenismo Histórico: parusia visível, ressurreição inaugural e milênio terreno com Cristo',
      'Pré-Milenismo Dispensacionalista: distinção Israel/Igreja, arrebatamento secreto, 70ª semana de Daniel e reino literal',
      'Amilenismo: milênio como o reinado celestial presente de Cristo e era da Igreja entre os dois adventos',
      'Pós-Milenismo: triunfo expansivo do Evangelho, cristianização gradual da sociedade e retorno glorioso consumador',
      'Análise comparativa exegética de Apocalipse 20:1-10',
    ],
    primaryReadings: [
      'George Eldon Ladd - The Presence of the Future / Crucial Questions About the Kingdom of God',
      'Anthony Hoekema - The Bible and the Future',
      'Loraine Boettner - The Millennium',
      'John F. Walvoord - The Millennial Kingdom',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'EXEGESIS_PAPER', 'THEOLOGICAL_DEBATE'],
  },
  {
    code: 'THEO.ADV.APOCALYPSE_MODELS',
    name: 'Modelos Interpretativos do Apocalipse',
    cycle: 3,
    competencyCode: 'THEO.ADV.APOCALYPSE_MODELS',
    description: 'As 4 principais correntes interpretativas do livro do Apocalipse: Preterismo, Historicismo, Idealismo e Futurismo.',
    topics: [
      'O gênero literário apocalíptico e simbolismo veterotestamentário',
      'A corrente Preterista (total e parcial): cumprimento central no século I e juízo de Jerusalém',
      'A corrente Historicista: o Apocalipse como mapa profético contínuo da história da Igreja ocidental',
      'A corrente Idealista (simbólica/filosófica): batalha cósmica espiritual perene entre o bem e o mal',
      'A corrente Futurista: eventos escatológicos concentrados na consumação final e parusia',
      'Princípios hermenêuticos para síntese pastoral e integridade canônica',
    ],
    primaryReadings: [
      'Richard Bauckham - The Theology of the Book of Revelation',
      'G. K. Beale - The Book of Revelation (NIGTC)',
      'Steve Gregg - Revelation: Four Views: A Parallel Commentary',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'EXEGESIS_PAPER'],
  },
  {
    code: 'THEO.ADV.ESCHATOLOGY_INDIVIDUAL_GENERAL',
    name: 'Escatologia Individual & Geral',
    cycle: 3,
    competencyCode: 'THEO.ADV.ESCHATOLOGY_INDIVIDUAL_GENERAL',
    description: 'Morte física, estado intermediário da alma, ressurreição corpórea universal, juízo final de vivos e mortos, inferno e condenação eterna, e Novos Céus e Nova Terra.',
    topics: [
      'A morte física como juízo e transição',
      'O estado intermediário: céu temporário e refutação do sono da alma/purgatório',
      'A Segunda Vinda de Cristo (Parusia) e seus sinais precursores',
      'A ressurreição corpórea universal dos justos e injustos',
      'O Juízo Final e o Tribunal de Cristo',
      'O destino dos réprobos: inferno, punição eterna consciente e justiça divina',
      'A consumação final: Novos Céus e Nova Terra e a comunhão perpétua com Deus',
    ],
    primaryReadings: [
      'Anthony Hoekema - The Bible and the Future',
      'C. S. Lewis - O Grande Abismo (The Great Divorce)',
      'Jonathan Edwards - The Eternity of Hell’s Torments',
      'Cornelis P. Venema - The Promise of the Future',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'EXEGESIS_PAPER', 'ORAL_DEFENSE'],
  },

  // Ciclo IV: Teologia Histórica, Pensamento & Prática
  {
    code: 'THEO.ADV.PATRISTICS',
    name: 'Patrística',
    cycle: 4,
    competencyCode: 'THEO.ADV.PATRISTICS',
    description: 'Os Pais Apostólicos, Apologistas primitivos e Doutores Antigos: teologia, martírio, defesa da fé e desenvolvimento doutrinário.',
    topics: [
      'Os Pais Apostólicos: Didaquê, Clemente de Roma, Inácio de Antioquia, Epístola de Policarpo',
      'Os Apologistas do século II: Justino Mártir, Atenágoras, Carta a Diogneto',
      'A resposta contra as heresias gnósticas: Irineu de Lião e a Regula Fidei',
      'A escola norte-africana: Tertuliano e Cipriano de Cartago',
      'A escola alexandrina: Clemente e Orígenes',
      'Os grandes teólogos do século IV: Atanásio e os Pais Capadócios',
      'Agostinho de Hipona e o ápice da teologia ocidental latina',
    ],
    primaryReadings: [
      'Padres Apostólicos (Coleção Patrística - Didaquê, Inácio, Clemente)',
      'Irineu de Lião - Contra as Heresias (Adversus Haereses)',
      'Justino Mártir - Primeira Apologia',
      'Agostinho de Hipona - Confissões',
    ],
    suggestedEvidenceTypes: ['BOOK_REVIEW', 'THEOLOGICAL_ESSAY'],
  },
  {
    code: 'THEO.ADV.HISTORIC_COUNCILS',
    name: 'Concílios Ecumênicos Históricos',
    cycle: 4,
    competencyCode: 'THEO.ADV.HISTORIC_COUNCILS',
    description: 'As controvérsias trinitárias e cristológicas e os quatro primeiros concílios ecumênicos: Niceia (325), Constantinopla (381), Éfeso (431) e Calcedônia (451).',
    topics: [
      'A controvérsia ariana e o Concílio de Niceia I (325 d.C.): homoousios vs homoiousios',
      'O Concílio de Constantinopla I (381 d.C.): divindade do Espírito Santo e o Credo Niceno-Constantinopolitano',
      'A controvérsia nestoriana e o Concílio de Éfeso (431 d.C.): Theotokos e a união pessoal',
      'A controvérsia eutiquiana/monofisita e o Concílio de Calcedônia (451 d.C.): as duas naturezas',
      'Os credos ecumênicos clássicos como balizas perpétuas da ortodoxia cristã',
    ],
    primaryReadings: [
      'Documentos dos Quatro Primeiros Concílios Ecumênicos',
      'Philip Schaff - The Creeds of Christendom (Volume 1 & 2)',
      'Jaroslav Pelikan - The Christian Tradition: A History of the Development of Doctrine (Vol. 1)',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'ORAL_DEFENSE'],
  },
  {
    code: 'THEO.ADV.PROTESTANT_REFORMATION',
    name: 'Reforma Protestante',
    cycle: 4,
    competencyCode: 'THEO.ADV.PROTESTANT_REFORMATION',
    description: 'Antecedentes medievais, os Cinco Solas e as quatro grandes vertentes da Reforma: Luterana, Reformada, Anabatista e Anglicana.',
    topics: [
      'Pré-reformadores medievais: John Wycliffe, Jan Hus, Valdenses',
      'Martinho Lutero e as 95 Teses: justificativa teológica da ruptura com o papado',
      'Os Cinco Solas da Reforma: Sola Scriptura, Sola Gratia, Sola Fide, Solus Christus, Soli Deo Gloria',
      'A vertente Reformada na Suíça: Ulrico Zuínglio e João Calvino em Genebra',
      'A Reforma Radical (Anabatismo): credobatismo e pacifismo',
      'A Reforma Inglesa (Anglicanismo): Thomas Cranmer e os 39 Artigos de Religião',
      'A Contrarreforma Católica e o Concílio de Trento',
    ],
    primaryReadings: [
      'Martinho Lutero - As 95 Teses e Disputa de Heidelberg',
      'João Calvino - Resposta a Sadoleto e Prefácio às Institutas',
      'Heiko Oberman - Luther: Man Between God and the Devil',
      'Diarmaid MacCulloch - The Reformation: A History',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW'],
  },
  {
    code: 'THEO.ADV.DENOMINATIONAL_HISTORY',
    name: 'História Denominacional',
    cycle: 4,
    competencyCode: 'THEO.ADV.DENOMINATIONAL_HISTORY',
    description: 'Gênese e desenvolvimento das grandes famílias confessionais protestantes: Presbiteriana, Batista, Metodista, Congregacional e Pentecostal no mundo e no Brasil.',
    topics: [
      'Origens e expansão do Presbiterianismo na Escócia e Américas',
      'O movimento Batista: surgimento na Inglaterra e difusão mundial',
      'O Avivamento Metodista na Inglaterra: John e Charles Wesley e a teologia prática',
      'O Congregacionalismo e o legado puritano',
      'O Movimento Pentecostal e Carismático: Rua Azusa e ondas de renovação no Sul Global',
      'A implantação das missões protestantes históricas no Brasil e América Latina',
    ],
    primaryReadings: [
      'Mark Noll - A History of Christianity in the United States and Canada',
      'Justo L. González - História Ilustrada do Cristianismo (Volumes 1 e 2)',
      'Antônio Gouvêa Mendonça - O Celeste Porvir: A Inserção do Protestantismo no Brasil',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'ORAL_DEFENSE'],
  },
  {
    code: 'THEO.ADV.HISTORICAL_THEOLOGY',
    name: 'Teologia Histórica',
    cycle: 4,
    competencyCode: 'THEO.ADV.HISTORICAL_THEOLOGY',
    description: 'Evolução e desenvolvimento orgânico dos dogmas e controvérsias teológicas da era patrística à modernidade contemporânea.',
    topics: [
      'Metodologia da Teologia Histórica e a dialética do desenvolvimento doutrinário',
      'A Escolástica Medieval: Anselmo, Abelardo, Tomás de Aquino, Ockham',
      'A Escolástica Protestante e a Era da Ortodoxia (séculos XVI-XVII)',
      'O Iluminismo e os desafios do Racionalismo à fé histórica',
      'A Teologia Liberal do século XIX (Schleiermacher, Ritschl, Harnack)',
      'A Neo-Ortodoxia (Karl Barth, Emil Brunner) e a reação evangélica',
      'A teologia contemporânea no Sul Global',
    ],
    primaryReadings: [
      'Alister E. McGrath - Historical Theology: An Introduction to the History of Christian Thought',
      'Jaroslav Pelikan - The Christian Tradition (Série em 5 Volumes)',
      'Roger E. Olson - The Story of Christian Theology',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'BOOK_REVIEW'],
  },
  {
    code: 'THEO.ADV.CHRISTIAN_APOLOGETICS',
    name: 'Apologética Cristã',
    cycle: 4,
    competencyCode: 'THEO.ADV.CHRISTIAN_APOLOGETICS',
    description: 'Fundamentos bíblicos e metodologias clássica, evidencialista e pressuposicionalista para a defesa racional da fé cristã no espaço público.',
    topics: [
      'Fundamento bíblico da defesa da fé (1Pe 3:15, Jd 3, At 17)',
      'Metodologia Apologética Clássica: Tomás de Aquino, C.S. Lewis, William Lane Craig',
      'Metodologia Evidencialista: fatos históricos, ressurreição de Cristo (Gary Habermas)',
      'Metodologia Pressuposicionalista: Cornelius Van Til, Greg Bahnsen, Francis Schaeffer',
      'Respostas ao Naturalismo Científico, Novo Ateísmo e Pós-Modernismo',
      'O problema do mal e do sofrimento: construção de teodiceias cristãs',
    ],
    primaryReadings: [
      'C. S. Lewis - Cristianismo Puro e Simples (Mere Christianity) / Milagres',
      'Cornelius Van Til - Christian Apologetics',
      'William Lane Craig - Reasonable Faith: Christian Truth and Apologetics',
      'Francis Schaeffer - O Deus que Intervém (The God Who Is There)',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_DEBATE', 'THEOLOGICAL_ESSAY', 'ORAL_DEFENSE'],
  },
  {
    code: 'THEO.ADV.PHILOSOPHY_OF_RELIGION',
    name: 'Filosofia da Religião',
    cycle: 4,
    competencyCode: 'THEO.ADV.PHILOSOPHY_OF_RELIGION',
    description: 'Argumentos clássicos para a existência de Deus, o problema do mal, fé e razão, e epistemologia religiosa reformada.',
    topics: [
      'Fé e Razão: fideísmo, racionalismo, compatibilismo (credo ut intelligam)',
      'Argumentos cosmológicos (Kalam e tomista)',
      'Argumentos teleológicos e o ajuste fino do universo (Fine-Tuning)',
      'Argumentos ontológicos (Anselmo, Plantinga)',
      'Argumento moral e a objetividade dos valores éticos',
      'Epistemologia Reformada e crença básica adequada em Deus (Alvin Plantinga)',
      'A coerência lógica do teísmo trinitário',
    ],
    primaryReadings: [
      'Alvin Plantinga - Warranted Christian Belief (Crença Cristã Avalizada)',
      'Tomás de Aquino - As Cinco Vias (Summa Theologiae, I, q. 2, a. 3)',
      'Richard Swinburne - The Existence of God',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'THEOLOGICAL_DEBATE'],
  },
  {
    code: 'THEO.ADV.CHRISTIAN_ETHICS',
    name: 'Ética Cristã',
    cycle: 4,
    competencyCode: 'THEO.ADV.CHRISTIAN_ETHICS',
    description: 'Fundamentos da lei moral divina, ética das virtudes, dilemas bioéticos contemporâneos, vocação, trabalho e ordem social.',
    topics: [
      'Fundamento ontológico da moral: a santidade e o caráter de Deus',
      'A Lei Moral Divina: o Decálogo e sua aplicação perpétua',
      'A ética do Reino no Sermão do Monte (Mt 5-7)',
      'Ética deontológica, teleológica e ética das virtudes bíblicas',
      'Bioética cristã: dignidade do embrião, aborto, eutanásia, biotecnologia',
      'Vocação, mordomia do trabalho, mercado e economia bíblica',
      'O cristão e o Estado: submissão justa e limites bíblicos',
    ],
    primaryReadings: [
      'Dietrich Bonhoeffer - Ética',
      'John Frame - The Doctrine of the Christian Life',
      'Oliver O’Donovan - Resurrection and Moral Order',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'THEOLOGICAL_DEBATE'],
  },
  {
    code: 'THEO.ADV.MISSIOLOGY',
    name: 'Missiologia',
    cycle: 4,
    competencyCode: 'THEO.ADV.MISSIOLOGY',
    description: 'A Missio Dei, fundamentos bíblicos das missões no AT e NT, contextualização sem sincretismo e história dos movimentos missionários.',
    topics: [
      'A Missio Dei como fundamentação teocêntrica da missão',
      'Fundamentos missionários do Antigo Testamento (aliança abraâmica e vocação das nações)',
      'A Grande Comissão no Novo Testamento (Mt 28, Mc 16, Lc 24, Jo 20, At 1)',
      'Teologia da contextualização cultural e prevenção do sincretismo',
      'História dos grandes movimentos missionários modernos',
      'A missão da Igreja na era contemporânea e o movimento missionário transcultural no Sul Global',
    ],
    primaryReadings: [
      'David J. Bosch - Transforming Mission: Paradigm Shifts in Theology of Mission',
      'John Stott - The Living God Is a Missionary God / Christian Mission in the Modern World',
      'Lesslie Newbigin - The Gospel in a Pluralist Society',
    ],
    suggestedEvidenceTypes: ['THEOLOGICAL_ESSAY', 'ORAL_DEFENSE'],
  },
];

export const SEMINARY_CYCLES_METADATA: SeminaryCycle[] = [
  {
    cycle: 1,
    name: 'Ciclo I: Fundamentos & Método',
    description: 'Fundamentos bibliológicos, hermenêuticos, exegéticos e teologia bíblica da redenção.',
    disciplines: SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 1),
  },
  {
    cycle: 2,
    name: 'Ciclo II: Teologia Sistemática I',
    description: 'Teologia Própria, Trindade, Antropologia, Hamartiologia, Cristologia, Pneumatologia e Angelologia.',
    disciplines: SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 2),
  },
  {
    cycle: 3,
    name: 'Ciclo III: Teologia Sistemática II',
    description: 'Soteriologia, Eclesiologia, Escatologia Comparada com as 4 escolas milenistas, Modelos Interpretativos do Apocalipse e Escatologia Individual e Geral.',
    disciplines: SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 3),
  },
  {
    cycle: 4,
    name: 'Ciclo IV: Teologia Histórica, Pensamento & Prática',
    description: 'Patrística, Concílios Ecumênicos Históricos, Reforma Protestante, História Denominacional, Teologia Histórica, Apologética Cristã, Filosofia da Religião, Ética Cristã e Missiologia.',
    disciplines: SEMINARY_DISCIPLINES_METADATA.filter((d) => d.cycle === 4),
  },
];

export const SEMINARY_THEOLOGY_PACK_PAYLOAD: SeminaryTheologyPackPayload = {
  code: 'ADVANCED_SEMINARY_THEOLOGY',
  name: 'Módulo Teológico Avançado (Nível Seminário)',
  description: 'Formação teológica profunda de nível de seminário cobrindo 4 ciclos de concentração e 24 disciplinas curriculares com bibliografia clássica e rigor acadêmico.',
  cycles: SEMINARY_CYCLES_METADATA,
};
