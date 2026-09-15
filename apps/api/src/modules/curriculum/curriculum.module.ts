import { Module } from '@nestjs/common';
import { ProgressionRepository } from './infrastructure/progression.repository.js';
import { ProgressionService } from './application/progression.service.js';
import { ProgressionController } from './presentation/progression.controller.js';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { DevotionalModule } from '../devotional/devotional.module.js';
import { CurriculumRepository } from './infrastructure/curriculum.repository.js';
import { ObjectiveRepository } from './infrastructure/objective.repository.js';
import { CurriculumTemplateEngine } from './infrastructure/curriculum-template.engine.js';
import { PedagogicalModelDefinitionResolver } from './infrastructure/pedagogical-model-definition.resolver.js';
import { TheologicalTraditionCatalogResolver } from './infrastructure/theological-tradition-catalog.resolver.js';
import { CurriculumDefinitionCatalogResolver } from './infrastructure/curriculum-definition-catalog.resolver.js';
import { EvidenceTypeCatalogResolver } from './infrastructure/evidence-type-catalog.resolver.js';
import { ProgressionPolicyCatalogResolver } from './infrastructure/progression-policy-catalog.resolver.js';
import { RubricCatalogResolver } from './infrastructure/rubric-catalog.resolver.js';
import { PedagogicalModelDefinitionSeeder } from './infrastructure/pedagogical-model-definition.seeder.js';
import { EvidenceTypeDefinitionSeeder } from './infrastructure/evidence-type-definition.seeder.js';
import { BibleTranslationDefinitionSeeder } from './infrastructure/bible-translation-definition.seeder.js';
import { BiblicalFormationSeeder } from './infrastructure/biblical-formation.seeder.js';
import { BiblicalFormationIntermediateSeeder } from './infrastructure/biblical-formation-intermediate.seeder.js';
import { BiblicalFormationOriginalLanguagesLiteracySeeder } from './infrastructure/biblical-formation-original-languages-literacy.seeder.js';
import { MusicFormationSeeder } from './infrastructure/music-formation.seeder.js';
import { MusicInstrumentsSeeder } from './infrastructure/music-instruments.seeder.js';
import { MusicChristianSeeder } from './infrastructure/music-christian.seeder.js';
import { TradesFormationSeeder } from './infrastructure/trades-formation.seeder.js';
import { CookingFormationSeeder } from './infrastructure/cooking-formation.seeder.js';
import { CookingProgressionSeeder } from './infrastructure/cooking-progression.seeder.js';
import { CookingLifeSkillsSeeder } from './infrastructure/cooking-life-skills.seeder.js';
import { GardeningFormationSeeder } from './infrastructure/gardening-formation.seeder.js';
import { GardeningProductionSeeder } from './infrastructure/gardening-production.seeder.js';
import { GardeningManagementPlanningSeeder } from './infrastructure/gardening-management-planning.seeder.js';
import { HomeSufficiencyFoundationsSeeder } from './infrastructure/home-sufficiency-foundations.seeder.js';
import { PersonalFinanceFoundationsSeeder } from './infrastructure/personal-finance-foundations.seeder.js';
import { ResilienceFormationSeeder } from './infrastructure/resilience-formation.seeder.js';
import { ResilienceNavigationCampingSeeder } from './infrastructure/resilience-navigation-camping.seeder.js';
import { ResilienceWaterFireSeeder } from './infrastructure/resilience-water-fire.seeder.js';
import { ResilienceRealEmergenciesSeeder } from './infrastructure/resilience-real-emergencies.seeder.js';
import { PhysicalFormationSeeder } from './infrastructure/physical-formation.seeder.js';
import { TechnologyFormationSeeder } from './infrastructure/technology-formation.seeder.js';
import { VocationFormationSeeder } from './infrastructure/vocation-formation.seeder.js';
import { MathSubjectSeeder } from './infrastructure/math-subject.seeder.js';
import { PortugueseSubjectSeeder } from './infrastructure/portuguese-subject.seeder.js';
import { ScienceSubjectSeeder } from './infrastructure/science-subject.seeder.js';
import { HistorySubjectSeeder } from './infrastructure/history-subject.seeder.js';
import { GeographySubjectSeeder } from './infrastructure/geography-subject.seeder.js';
import { LanguageSubjectSeeder } from './infrastructure/language-subject.seeder.js';
import { TradesWoodworkingConstructionSeeder } from './infrastructure/trades-woodworking-construction.seeder.js';
import { TradesTextileCraftSeeder } from './infrastructure/trades-textile-craft.seeder.js';
import { TradesMechanicalElectricalHomeSeeder } from './infrastructure/trades-mechanical-electrical-home.seeder.js';
import { FoundationalCurriculumSeeder } from './infrastructure/foundational-curriculum.seeder.js';
import { DefinitionsRepository } from './infrastructure/definitions.repository.js';
import { ProfilesRepository } from './infrastructure/profiles.repository.js';
import { EvidenceSubmissionRepository } from './infrastructure/evidence-submission.repository.js';
import { AssessmentResultRepository } from './infrastructure/assessment-result.repository.js';
import { CurriculumPackRepository } from './infrastructure/curriculum-pack.repository.js';
import { LearnerCompetencyTrackingRepository } from './infrastructure/learner-competency-tracking.repository.js';
import { CurriculumService } from './application/curriculum.service.js';
import { ObjectiveService } from './application/objective.service.js';
import { DefinitionsService } from './application/definitions.service.js';
import { ProfilesService } from './application/profiles.service.js';
import { EvidenceSubmissionService } from './application/evidence-submission.service.js';
import { AssessmentResultService } from './application/assessment-result.service.js';
import { BibleTranslationCompareService } from './application/bible-translation-compare.service.js';
import { CurriculumPackService } from './application/curriculum-pack.service.js';
import { CurriculumPackExportService } from './application/curriculum-pack-export.service.js';
import { CurriculumPackImportService } from './application/curriculum-pack-import.service.js';
import { LearnerCompetencyTrackingService } from './application/learner-competency-tracking.service.js';
import { CURRICULUM_PUBLIC_API } from './application/public-api.js';
import { CurriculumController } from './presentation/curriculum.controller.js';
import { ObjectiveController } from './presentation/objective.controller.js';
import { DefinitionsController } from './presentation/definitions.controller.js';
import { ProfilesController } from './presentation/profiles.controller.js';
import { EvidenceSubmissionController } from './presentation/evidence-submission.controller.js';
import { AssessmentResultController } from './presentation/assessment-result.controller.js';
import { BibleTranslationCompareController } from './presentation/bible-translation-compare.controller.js';
import { CurriculumPackController } from './presentation/curriculum-pack.controller.js';
import { LearnerCompetencyTrackingController } from './presentation/learner-competency-tracking.controller.js';
import { AchievementRepository } from './infrastructure/achievement.repository.js';
import { AchievementController } from './presentation/achievement.controller.js';
import { ArtsFormationSeeder } from './infrastructure/arts-formation.seeder.js';
import { ServiceCommunityFormationSeeder } from './infrastructure/service-community-formation.seeder.js';
import { FamilyCurriculumPackRepository } from './infrastructure/family-curriculum-pack.repository.js';
import { FamilyCurriculumPackService } from './application/family-curriculum-pack.service.js';
import { FamilyCurriculumPackController } from './presentation/family-curriculum-pack.controller.js';

@Module({
  imports: [DatabaseModule, DevotionalModule],
  controllers: [
    ProgressionController,
    CurriculumController,
    ObjectiveController,
    DefinitionsController,
    ProfilesController,
    EvidenceSubmissionController,
    AssessmentResultController,
    BibleTranslationCompareController,
    CurriculumPackController,
    LearnerCompetencyTrackingController,
    AchievementController,
    FamilyCurriculumPackController,
  ],
  providers: [
    ProgressionRepository,
    ProgressionService,
    CurriculumRepository,
    ObjectiveRepository,
    CurriculumTemplateEngine,
    PedagogicalModelDefinitionResolver,
    TheologicalTraditionCatalogResolver,
    CurriculumDefinitionCatalogResolver,
    EvidenceTypeCatalogResolver,
    ProgressionPolicyCatalogResolver,
    RubricCatalogResolver,
    PedagogicalModelDefinitionSeeder,
    EvidenceTypeDefinitionSeeder,
    BibleTranslationDefinitionSeeder,
    BiblicalFormationSeeder,
    BiblicalFormationIntermediateSeeder,
    BiblicalFormationOriginalLanguagesLiteracySeeder,
    MusicFormationSeeder,
    MusicInstrumentsSeeder,
    MusicChristianSeeder,
    TradesFormationSeeder,
    CookingFormationSeeder,
    CookingProgressionSeeder,
    CookingLifeSkillsSeeder,
    GardeningFormationSeeder,
    GardeningProductionSeeder,
    GardeningManagementPlanningSeeder,
    HomeSufficiencyFoundationsSeeder,
    PersonalFinanceFoundationsSeeder,
    ResilienceFormationSeeder,
    ResilienceNavigationCampingSeeder,
    ResilienceWaterFireSeeder,
    ResilienceRealEmergenciesSeeder,
    PhysicalFormationSeeder,
    TechnologyFormationSeeder,
    VocationFormationSeeder,
    MathSubjectSeeder,
    PortugueseSubjectSeeder,
    ScienceSubjectSeeder,
    HistorySubjectSeeder,
    GeographySubjectSeeder,
    LanguageSubjectSeeder,
    TradesWoodworkingConstructionSeeder,
    TradesTextileCraftSeeder,
    TradesMechanicalElectricalHomeSeeder,
    FoundationalCurriculumSeeder,
    DefinitionsRepository,
    ProfilesRepository,
    EvidenceSubmissionRepository,
    AssessmentResultRepository,
    CurriculumPackRepository,
    LearnerCompetencyTrackingRepository,
    AchievementRepository,
    ArtsFormationSeeder,
    ServiceCommunityFormationSeeder,
    FamilyCurriculumPackRepository,
    CurriculumService,
    ObjectiveService,
    DefinitionsService,
    ProfilesService,
    EvidenceSubmissionService,
    AssessmentResultService,
    BibleTranslationCompareService,
    CurriculumPackService,
    CurriculumPackExportService,
    CurriculumPackImportService,
    LearnerCompetencyTrackingService,
    FamilyCurriculumPackService,
    {
      provide: CURRICULUM_PUBLIC_API,
      useExisting: CurriculumService,
    },
  ],
  exports: [CURRICULUM_PUBLIC_API, CurriculumService, ObjectiveService],
})
export class CurriculumModule {}
