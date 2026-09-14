import { Injectable } from '@nestjs/common';
import {
  addCurriculumDefinitionCompetencySchema,
  addCurriculumDefinitionDomainSchema,
  createCurriculumDefinitionSchema,
  createProgressionPolicySchema,
} from '@aletheia/contracts';
import { DefinitionsService } from '../application/definitions.service.js';
import { BiblicalFormationSeeder } from './biblical-formation.seeder.js';
import { MusicFormationSeeder } from './music-formation.seeder.js';
import { TradesFormationSeeder } from './trades-formation.seeder.js';
import { CookingFormationSeeder } from './cooking-formation.seeder.js';
import { GardeningFormationSeeder } from './gardening-formation.seeder.js';
import { ResilienceFormationSeeder } from './resilience-formation.seeder.js';

const CURRICULUM_CODE = 'FOUNDATIONAL.FAMILY_FORMATION';
const POLICY_CODE = 'FOUNDATIONAL.FAMILY_FORMATION.EVIDENCE_COUNT';
const DOMAIN_CODES = [
  'FAITH.BIBLICAL_FORMATION',
  'MUSIC',
  'TRADES',
  'COOKING',
  'GARDENING',
  'RESILIENCE',
] as const;

export interface FoundationalCurriculumSeedResult {
  curriculumCreated: boolean;
  policyCreated: boolean;
  domainsLinked: number;
  competenciesLinked: number;
}

@Injectable()
export class FoundationalCurriculumSeeder {
  constructor(
    private readonly definitionsService: DefinitionsService,
    private readonly biblicalFormationSeeder: BiblicalFormationSeeder,
    private readonly musicFormationSeeder: MusicFormationSeeder,
    private readonly tradesFormationSeeder: TradesFormationSeeder,
    private readonly cookingFormationSeeder: CookingFormationSeeder,
    private readonly gardeningFormationSeeder: GardeningFormationSeeder,
    private readonly resilienceFormationSeeder: ResilienceFormationSeeder,
  ) {}

  async seed(): Promise<FoundationalCurriculumSeedResult> {
    for (const seeder of [
      this.biblicalFormationSeeder,
      this.musicFormationSeeder,
      this.tradesFormationSeeder,
      this.cookingFormationSeeder,
      this.gardeningFormationSeeder,
      this.resilienceFormationSeeder,
    ]) {
      await seeder.seed();
    }

    const domains = await this.definitionsService.listLearningDomains();
    const selectedDomains = DOMAIN_CODES.map((code) => domains.find((domain) =>
      domain.code === code && domain.version === 1 && domain.status === 'PUBLISHED'));
    if (selectedDomains.some((domain) => !domain)) {
      throw new Error('Foundational curriculum requires every foundational domain to be published first.');
    }

    const domainRows = selectedDomains as NonNullable<(typeof selectedDomains)[number]>[];
    const domainIds = new Set(domainRows.map((domain) => domain.id));
    const competencies = (await this.definitionsService.listCompetencyDefinitions()).filter((competency) =>
      competency.version === 1 && competency.status === 'PUBLISHED' && domainIds.has(competency.domainId),
    );
    if (competencies.length === 0) {
      throw new Error('Foundational curriculum requires published foundational competencies first.');
    }

    const existingCurriculum = (await this.definitionsService.listCurriculumDefinitions()).find((definition) =>
      definition.code === CURRICULUM_CODE && definition.version === 1,
    );
    let curriculum = existingCurriculum;
    let curriculumCreated = false;
    if (!curriculum) {
      curriculum = await this.definitionsService.createCurriculumDefinition(createCurriculumDefinitionSchema.parse({
        code: CURRICULUM_CODE,
        name: 'Formação Integral — Fundamentos',
        description: 'Currículo de referência do Aletheia para ativação familiar por competências, reunindo as trilhas fundacionais publicadas.',
        metadata: { source: 'issue-126-cutover', composition: 'foundational-domains' },
      }));
      curriculumCreated = true;
    } else if (curriculum.status === 'DEPRECATED' || curriculum.status === 'ARCHIVED') {
      throw new Error(`Foundational curriculum version 1 is ${curriculum.status} and cannot be activated.`);
    }

    const linkedDomains = await this.definitionsService.listCurriculumDefinitionDomains(curriculum.id);
    const linkedDomainIds = new Set(linkedDomains.map((link) => link.domainId));
    const missingDomains = domainRows.filter((domain) => !linkedDomainIds.has(domain.id));
    const linkedCompetencies = await this.definitionsService.listCurriculumDefinitionCompetencies(curriculum.id);
    const linkedCompetencyIds = new Set(linkedCompetencies.map((link) => link.competencyId));
    const missingCompetencies = competencies.filter((competency) => !linkedCompetencyIds.has(competency.id));
    if (curriculum.status === 'PUBLISHED' && (missingDomains.length > 0 || missingCompetencies.length > 0)) {
      throw new Error('Published foundational curriculum is missing immutable composition links; create a new version instead.');
    }

    for (const [order, domain] of missingDomains.entries()) {
      await this.definitionsService.addCurriculumDefinitionDomain(curriculum.id, addCurriculumDefinitionDomainSchema.parse({
        domainId: domain.id,
        required: true,
        order,
      }));
    }
    for (const [order, competency] of missingCompetencies.entries()) {
      await this.definitionsService.addCurriculumDefinitionCompetency(curriculum.id, addCurriculumDefinitionCompetencySchema.parse({
        competencyId: competency.id,
        required: true,
        order,
      }));
    }

    const existingPolicy = (await this.definitionsService.listProgressionPolicies()).find((policy) =>
      policy.code === POLICY_CODE && policy.version === 1,
    );
    let policyCreated = false;
    if (!existingPolicy) {
      const createdPolicy = await this.definitionsService.createProgressionPolicy(createProgressionPolicySchema.parse({
        code: POLICY_CODE,
        name: 'Evidência validada — Fundamentos',
        description: 'Uma evidência validada é suficiente para marcar uma competência fundacional como dominada, respeitando pré-requisitos futuros.',
        policyType: 'EVIDENCE_COUNT',
        rules: { minimumEvidenceCount: 1, prerequisites: [] },
        curriculumDefinitionId: curriculum.id,
        metadata: { source: 'issue-126-cutover' },
      }));
      await this.definitionsService.transitionProgressionPolicyStatus(createdPolicy.id, 'PUBLISHED');
      policyCreated = true;
    } else {
      if (existingPolicy.curriculumDefinitionId !== curriculum.id || existingPolicy.policyType !== 'EVIDENCE_COUNT') {
        throw new Error('Foundational progression policy has an incompatible curriculum or policy type.');
      }
      if (existingPolicy.status === 'DRAFT') {
        await this.definitionsService.transitionProgressionPolicyStatus(existingPolicy.id, 'PUBLISHED');
      } else if (existingPolicy.status !== 'PUBLISHED') {
        throw new Error(`Foundational progression policy version 1 is ${existingPolicy.status} and cannot be activated.`);
      }
    }

    if (curriculum.status === 'DRAFT') {
      await this.definitionsService.transitionCurriculumDefinitionStatus(curriculum.id, 'PUBLISHED');
    }

    return {
      curriculumCreated,
      policyCreated,
      domainsLinked: missingDomains.length,
      competenciesLinked: missingCompetencies.length,
    };
  }
}
