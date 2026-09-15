import {
  createLearningDomainSchema,
  createLearningPathSchema,
  createCompetencyDefinitionSchema,
  type CreateLearningDomainOutput,
  type CreateLearningPathOutput,
  type CreateCompetencyDefinitionOutput,
} from '@aletheia/contracts';

// --- Issue #95 section 20 seed data: "Resiliência, Outdoor e Preparação
// Familiar" -- Emergências reais ---
//
// The `RESILIENCE` LearningDomain already exists (PR #137), with
// `RESILIENCE.FIRST_AID` (#137), `RESILIENCE.NAVIGATION` /
// `RESILIENCE.CAMPING` (#157), and `RESILIENCE.WATER` / `RESILIENCE.FIRE`
// (#160) as sibling LearningPaths. This adds the sixth and last
// subsection as its own LearningPath -- Emergências reais
// (RESILIENCE.REAL_EMERGENCIES) -- last of 3 sibling PRs, completing
// issue #95 section 20.
//
// Item list taken verbatim from issue #95 section 20's "Emergências
// reais" subsection: falta de energia, tempestades, enchentes, incêndios,
// eventos climáticos, evacuação, ponto de encontro familiar, contatos de
// emergência, kit de emergência, comunicação durante emergência (10
// items, one competency each).
//
// Scope-neutrality against sibling Resiliência paths already shipped:
//   - RESILIENCE.REAL_EMERGENCIES.FIRES is about recognizing a fire
//     emergency and evacuating (the crisis-response side), NOT fire
//     prevention/campfire/extinguishing skills -- those already live in
//     RESILIENCE.FIRE (#160). No overlap in content or title.
//   - RESILIENCE.REAL_EMERGENCIES.EMERGENCY_CONTACTS is the family's own
//     contact list/communication tree for a real emergency, NOT the
//     public emergency numbers (SAMU/Bombeiros/Polícia) already covered
//     by RESILIENCE.FIRST_AID.EMERGENCY_NUMBERS (#137). Distinct content,
//     distinct purpose.
//   - No CPR/Heimlich, animal-bite, or getting-lost items are added here:
//     they're not part of this subsection's issue #95 item list, and the
//     first (CPR/choking response) would duplicate
//     RESILIENCE.FIRST_AID.CHOKING's existing scope (#137) rather than
//     extend it. Kept out per the same literal-item-list discipline
//     applied to every other Resiliência PR in this group (#157, #160).
//
// Per PR #154 (packages/contracts/src/educational-taxonomy.ts): every
// competency here uses `ageRecommendation`, so
// createCompetencyDefinitionSchema's transform (curriculum-definitions.ts)
// automatically derives `progressionAxis: 'DOMAIN_PROFICIENCY'` (plus
// `educationalStages` from the age range) via `progressionMetadataForCode`
// -- no manual metadata needed.

const DOMAIN_CODE = 'RESILIENCE';

export interface ResilienceRealEmergenciesDomainSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceRealEmergenciesPathSeed {
  code: string;
  name: string;
  description: string;
}

export interface ResilienceRealEmergenciesCompetencySeed {
  code: string;
  title: string;
  level: number;
  ageRecommendation: { min: number; max: number };
  evidenceTypes: string[];
  starterObjectives: string[];
}

export interface ResilienceRealEmergenciesPathSeedData {
  path: ResilienceRealEmergenciesPathSeed;
  competencies: ResilienceRealEmergenciesCompetencySeed[];
}

export interface ResilienceRealEmergenciesSeedData {
  domain: ResilienceRealEmergenciesDomainSeed;
  paths: ResilienceRealEmergenciesPathSeedData[];
}

export function buildResilienceRealEmergenciesSeedData(): ResilienceRealEmergenciesSeedData {
  return {
    // Identical to resilience-formation.seed-data.ts's domain seed --
    // reused here only as a defensive fallback in case this seeder runs
    // before ResilienceFormationSeeder. Whichever runs first creates the
    // domain; the other finds it already present and is a no-op.
    domain: {
      code: DOMAIN_CODE,
      name: 'Resiliência, Outdoor e Preparação Familiar',
      description:
        'Formação para preservar a vida, prevenir riscos e ajudar outras pessoas com calma e método -- começando pelos primeiros socorros, o ponto de partida mais universal e seguro, antes de qualquer trilha futura e separada desta mesma fundação (cada subseção do domínio, uma trilha própria). Foco constante em prevenção, segurança e cuidado com o próximo.',
    },
    paths: [
      {
        path: {
          code: 'RESILIENCE.REAL_EMERGENCIES',
          name: 'Emergências Reais',
          description:
            'Trilha de emergências reais -- reconhecer situações de emergência doméstica ou climática, saber o que fazer com a família e sempre sob a orientação de um adulto responsável (issue #95 seção 20, subseção "Emergências reais").',
        },
        competencies: [
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.POWER_OUTAGE',
            title: 'Falta de Energia',
            level: 1,
            ageRecommendation: { min: 6, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar o que fazer com calma durante uma falta de energia (usar lanterna em vez de vela quando possível, avisar um adulto, evitar abrir a geladeira sem necessidade)',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.STORMS',
            title: 'Tempestades',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Explicar como se manter seguro durante uma tempestade com raios (permanecer dentro de casa, evitar áreas abertas e árvores altas) com apoio de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.FLOODS',
            title: 'Enchentes',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Reconhecer sinais de risco de enchente e explicar, com apoio de um adulto responsável, para onde ir e o que evitar (água em movimento, áreas baixas)',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.FIRES',
            title: 'Incêndios',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Reconhecer sinais de um princípio de incêndio em casa e explicar os primeiros passos ao perceber um: avisar os adultos, sair do ambiente e ligar para os bombeiros',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.WEATHER_EVENTS',
            title: 'Eventos Climáticos',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Identificar, com apoio de um adulto responsável, pelo menos dois eventos climáticos que exigem atenção especial na própria região e como a família se prepara para eles',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.EVACUATION',
            title: 'Evacuação',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Participar de um plano de evacuação familiar simples (rota de saída, o que levar, para onde ir), sempre sob orientação e supervisão de um adulto responsável',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.FAMILY_MEETING_POINT',
            title: 'Ponto de Encontro Familiar',
            level: 1,
            ageRecommendation: { min: 6, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Memorizar, com apoio de um adulto responsável, o ponto de encontro combinado pela família em caso de emergência e explicar por que ele é importante',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.EMERGENCY_CONTACTS',
            title: 'Contatos de Emergência da Família',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['text'],
            starterObjectives: [
              'Organizar, com apoio de um adulto responsável, uma lista simples de contatos de emergência da própria família (parentes próximos, vizinhos de confiança) além dos números públicos de emergência',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.EMERGENCY_KIT',
            title: 'Kit de Emergência',
            level: 1,
            ageRecommendation: { min: 7, max: 14 },
            evidenceTypes: ['photo', 'observation'],
            starterObjectives: [
              'Ajudar a montar e verificar, com apoio de um adulto responsável, um kit básico de emergência (água, lanterna, itens de saúde básica, documentos)',
            ],
          },
          {
            code: 'RESILIENCE.REAL_EMERGENCIES.COMMUNICATION',
            title: 'Comunicação Durante Emergência',
            level: 1,
            ageRecommendation: { min: 8, max: 14 },
            evidenceTypes: ['text', 'observation'],
            starterObjectives: [
              'Explicar como se comunicar com a família durante uma emergência (quem avisar primeiro, como manter a calma na mensagem) com apoio de um adulto responsável',
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

export function buildResilienceRealEmergenciesDomainDto(
  seed: ResilienceRealEmergenciesDomainSeed,
): CreateLearningDomainOutput {
  return createLearningDomainSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
  });
}

export function buildResilienceRealEmergenciesPathDto(
  seed: ResilienceRealEmergenciesPathSeed,
  domainId: string,
): CreateLearningPathOutput {
  return createLearningPathSchema.parse({
    code: seed.code,
    name: seed.name,
    description: seed.description,
    domainId,
  });
}

export function buildResilienceRealEmergenciesCompetencyDto(
  seed: ResilienceRealEmergenciesCompetencySeed,
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
