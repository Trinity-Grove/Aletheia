import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Core academic subject seed data: "Geografia" ---
//
// Issue #144 Lote 1: fourth and final core academic subject in this
// batch, after Matemática (#142/#145), Ciências (#147), and História
// (#149). Same shape and reasoning: real grade/age progression via
// multiple LearningPaths under one LearningDomain, grade-band naming
// aligned with this codebase's existing EducationalStage convention
// (apps/api/prisma/schema.prisma, packages/contracts/src/learner.ts,
// the exact Portuguese labels already shown to families in
// apps/web/src/components/learners/learner-form-modal.tsx):
//   EARLY_YEARS      -> "Educação Infantil (Early Years)"
//   PRIMARY_GRAMMAR  -> "Ensino Fundamental I (Grammar)"
//   MIDDLE_LOGIC     -> "Ensino Fundamental II (Logic)"
//   HIGH_RHETORIC    -> "Ensino Médio (Rhetoric)"
//
// This first slice covers three bands -- EARLY_YEARS (spatial awareness
// only: perto/longe, casa/vizinhança, no formal cartography yet),
// PRIMARY_GRAMMAR (Brazil geography basics: cardinal directions,
// continents/oceans, Brazilian states/regions/biomes/water resources,
// urban vs rural space) and MIDDLE_LOGIC (physical/human geography:
// relief, climate types, cartography/scale, population/demographics,
// urbanization/migration, natural resources/sustainability).
// HIGH_RHETORIC is deliberately NOT covered here: a real Ensino Médio
// geography curriculum needs geopolitics and economic geography (trade
// blocs, globalization, geopolitical conflict), a meaningfully bigger
// step than extending the existing pattern -- left as explicit
// follow-up.
//
// Pre-existing content: curriculum-template.engine.ts has a flat
// "Geografia" Subject stub in the TRADITIONAL framework (description:
// "Relevo, clima, cartografia, regiões brasileiras e geopolítica
// mundial", starter objectives about locating continents/oceans/
// Brazilian states on a map and understanding Brazilian biomes/water
// resources) and still drives applyTemplate's legacy plan for that
// framework. This domain doesn't touch or duplicate it -- both coexist.
// The tone/scope below was cross-checked against that stub to stay
// consistent (continents/oceans, Brazilian states, biomes, and water
// resources all reappear here as real, separately trackable competencies
// instead of two generic starter objectives).

const DOMAIN_CODE = 'GEOGRAPHY';
const EARLY_YEARS_PATH_CODE = 'GEOGRAPHY.EARLY_YEARS';
const PRIMARY_GRAMMAR_PATH_CODE = 'GEOGRAPHY.PRIMARY_GRAMMAR';
const MIDDLE_LOGIC_PATH_CODE = 'GEOGRAPHY.MIDDLE_LOGIC';

export interface GeographySubjectDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface GeographySubjectPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface GeographySubjectCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface GeographySubjectPathSeedData {
  path: GeographySubjectPathSeed;
  competencies: GeographySubjectCompetencySeed[];
}

export interface GeographySubjectSeedData {
  domain: GeographySubjectDomainSeed;
  paths: GeographySubjectPathSeedData[];
}

export function buildGeographySubjectSeedData(): GeographySubjectSeedData {
  return {
    domain: {
      code: DOMAIN_CODE,
      name: 'Geografia',
      description:
        'Compreensão do espaço, das paisagens naturais e humanas, e das relações entre sociedade e território, com progressão real por faixa de idade/série -- cada trilha deste domínio corresponde a um estágio educacional (EducationalStage), começando pela orientação espacial pessoal e avançando para a geografia física e humana do Brasil e do mundo em nível fundamental. Uma abordagem geopolítica e socioeconômica mais aprofundada para o Ensino Médio é trabalho futuro, não coberta nesta fatia.',
    },
    paths: [
      {
        path: {
          code: EARLY_YEARS_PATH_CODE,
          name: 'Geografia -- Educação Infantil (Early Years)',
          description:
            'Geografia para a Educação Infantil (aproximadamente 4 a 5 anos) -- noções espaciais básicas, casa e vizinhança, elementos da natureza ao redor, desenho de mapas simples, observação do clima e das estações do ano, sem cartografia formal ainda.',
        },
        competencies: [
          {
            code: 'GEOGRAPHY.EARLY_YEARS.SPATIAL_AWARENESS',
            title: 'Noções Espaciais Básicas',
            level: 1,
            ageRecommendation: { min: 4, max: 5 },
            evidenceTypes: ['observation', 'video'],
            starterObjectives: [
              'Usar corretamente noções espaciais (perto/longe, dentro/fora, em cima/embaixo) para descrever a posição de objetos',
              'Seguir instruções simples de localização (ex.: "coloque o brinquedo embaixo da mesa")',
            ],
          },
          {
            code: 'GEOGRAPHY.EARLY_YEARS.HOME_NEIGHBORHOOD',
            title: 'Casa e Vizinhança',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Descrever os cômodos da própria casa e pelo menos um lugar importante da vizinhança (ex.: mercado, praça, escola)',
            ],
          },
          {
            code: 'GEOGRAPHY.EARLY_YEARS.NATURE_ELEMENTS',
            title: 'Elementos da Natureza ao Redor',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Identificar elementos naturais do ambiente próximo (ex.: árvore, rio, montanha, praia) e diferenciá-los de elementos construídos pelo homem',
            ],
          },
          {
            code: 'GEOGRAPHY.EARLY_YEARS.SIMPLE_MAP_DRAWING',
            title: 'Desenho de Mapas Simples',
            level: 1,
            ageRecommendation: { min: 5, max: 6 },
            evidenceTypes: ['photo'],
            starterObjectives: [
              'Desenhar um mapa simples de um espaço conhecido (ex.: o próprio quarto, o quintal), incluindo pelo menos três elementos',
            ],
          },
          {
            code: 'GEOGRAPHY.EARLY_YEARS.WEATHER_SEASONS',
            title: 'Clima e Estações do Ano ao Redor',
            level: 1,
            ageRecommendation: { min: 4, max: 6 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Observar e descrever mudanças simples no tempo e nas estações do ano ao longo do ano',
            ],
          },
        ],
      },
      {
        path: {
          code: PRIMARY_GRAMMAR_PATH_CODE,
          name: 'Geografia -- Ensino Fundamental I (Grammar)',
          description:
            'Geografia para o Ensino Fundamental I (aproximadamente 6 a 10 anos) -- pontos cardeais e orientação, continentes e oceanos, estados e regiões do Brasil, biomas brasileiros, recursos hídricos, espaço urbano e rural.',
        },
        competencies: [
          {
            code: 'GEOGRAPHY.PRIMARY_GRAMMAR.CARDINAL_DIRECTIONS',
            title: 'Pontos Cardeais e Orientação',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Identificar e usar os pontos cardeais (norte, sul, leste, oeste) para se orientar',
              'Ler um mapa simples usando uma legenda',
            ],
          },
          {
            code: 'GEOGRAPHY.PRIMARY_GRAMMAR.CONTINENTS_OCEANS',
            title: 'Continentes e Oceanos',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Localizar os continentes e oceanos em um mapa-múndi ou globo',
            ],
          },
          {
            code: 'GEOGRAPHY.PRIMARY_GRAMMAR.BRAZIL_STATES_REGIONS',
            title: 'Estados e Regiões do Brasil',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Localizar o próprio estado e identificar as cinco regiões do Brasil em um mapa',
            ],
          },
          {
            code: 'GEOGRAPHY.PRIMARY_GRAMMAR.BRAZILIAN_BIOMES',
            title: 'Biomas Brasileiros',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Descrever características de pelo menos dois biomas brasileiros (ex.: Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa, Pantanal)',
            ],
          },
          {
            code: 'GEOGRAPHY.PRIMARY_GRAMMAR.WATER_RESOURCES',
            title: 'Recursos Hídricos',
            level: 1,
            ageRecommendation: { min: 7, max: 10 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Identificar os principais rios e bacias hidrográficas do Brasil e explicar a importância da água doce',
            ],
          },
          {
            code: 'GEOGRAPHY.PRIMARY_GRAMMAR.URBAN_RURAL',
            title: 'Espaço Urbano e Rural',
            level: 1,
            ageRecommendation: { min: 6, max: 9 },
            evidenceTypes: ['photo', 'text'],
            starterObjectives: [
              'Comparar características do espaço urbano e do espaço rural, dando exemplos de cada um',
            ],
          },
        ],
      },
      {
        path: {
          code: MIDDLE_LOGIC_PATH_CODE,
          name: 'Geografia -- Ensino Fundamental II (Logic)',
          description:
            'Geografia para o Ensino Fundamental II (aproximadamente 11 a 14 anos) -- relevo e formas de terreno, tipos climáticos, cartografia e escala, população e demografia, urbanização e migração, recursos naturais e sustentabilidade.',
        },
        competencies: [
          {
            code: 'GEOGRAPHY.MIDDLE_LOGIC.RELIEF_LANDFORMS',
            title: 'Relevo e Formas de Terreno',
            level: 2,
            ageRecommendation: { min: 10, max: 12 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Identificar e descrever as principais formas de relevo (planície, planalto, depressão, montanha) e sua influência na ocupação humana',
            ],
          },
          {
            code: 'GEOGRAPHY.MIDDLE_LOGIC.CLIMATE_TYPES',
            title: 'Tipos Climáticos',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Diferenciar os principais tipos climáticos do Brasil e do mundo, relacionando-os à vegetação e à ocupação humana',
            ],
          },
          {
            code: 'GEOGRAPHY.MIDDLE_LOGIC.CARTOGRAPHY_SCALE',
            title: 'Cartografia e Escala',
            level: 2,
            ageRecommendation: { min: 11, max: 13 },
            evidenceTypes: ['text', 'photo'],
            starterObjectives: [
              'Interpretar um mapa usando escala, legenda e coordenadas geográficas simples (latitude e longitude)',
            ],
          },
          {
            code: 'GEOGRAPHY.MIDDLE_LOGIC.POPULATION_DEMOGRAPHICS',
            title: 'População e Demografia',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Interpretar dados demográficos simples (ex.: densidade populacional, crescimento populacional) de uma região',
            ],
          },
          {
            code: 'GEOGRAPHY.MIDDLE_LOGIC.URBANIZATION_MIGRATION',
            title: 'Urbanização e Migração',
            level: 2,
            ageRecommendation: { min: 12, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar as causas e consequências do processo de urbanização e de um movimento migratório real',
            ],
          },
          {
            code: 'GEOGRAPHY.MIDDLE_LOGIC.NATURAL_RESOURCES_SUSTAINABILITY',
            title: 'Recursos Naturais e Sustentabilidade',
            level: 2,
            ageRecommendation: { min: 11, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar a diferença entre recursos naturais renováveis e não renováveis, discutindo um caso real de uso sustentável ou insustentável',
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

export function buildGeographySubjectDomainDto(seed: GeographySubjectDomainSeed): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildGeographySubjectPathDto(
  seed: GeographySubjectPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildGeographySubjectCompetencyDto(
  seed: GeographySubjectCompetencySeed,
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
