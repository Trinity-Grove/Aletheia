import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'node:process';
import type { IncomingMessage } from 'node:http';
import { AppModule } from './app.module';
import { parseEnvironment } from './platform/config/environment';
import { PinoNestLoggerService } from './platform/logging/pino-nest-logger.service';
import { DataMigrationRunner } from './platform/database/data-migration-runner';
import { LegalConsentDefinitionsSeeder } from './modules/privacy/infrastructure/legal-consent-definitions.seeder';
import { JurisdictionDefinitionSeeder } from './modules/jurisdictions/infrastructure/jurisdiction-definition.seeder';
import { PedagogicalModelDefinitionSeeder } from './modules/curriculum/infrastructure/pedagogical-model-definition.seeder';
import { EvidenceTypeDefinitionSeeder } from './modules/curriculum/infrastructure/evidence-type-definition.seeder';
import { BibleTranslationDefinitionSeeder } from './modules/curriculum/infrastructure/bible-translation-definition.seeder';
import { TheologicalTraditionSeeder } from './modules/curriculum/infrastructure/theological-tradition.seeder';
import { MathSubjectSeeder } from './modules/curriculum/infrastructure/math-subject.seeder';
import { ScienceSubjectSeeder } from './modules/curriculum/infrastructure/science-subject.seeder';
import { HistorySubjectSeeder } from './modules/curriculum/infrastructure/history-subject.seeder';
import { GeographySubjectSeeder } from './modules/curriculum/infrastructure/geography-subject.seeder';
import { LanguageSubjectSeeder } from './modules/curriculum/infrastructure/language-subject.seeder';
import { ArtsFormationSeeder } from './modules/curriculum/infrastructure/arts-formation.seeder';
import { ServiceCommunityFormationSeeder } from './modules/curriculum/infrastructure/service-community-formation.seeder';
import { PhysicalFormationSeeder } from './modules/curriculum/infrastructure/physical-formation.seeder';
import { TechnologyFormationSeeder } from './modules/curriculum/infrastructure/technology-formation.seeder';
import { VocationFormationSeeder } from './modules/curriculum/infrastructure/vocation-formation.seeder';
import { HomeSufficiencyFoundationsSeeder } from './modules/curriculum/infrastructure/home-sufficiency-foundations.seeder';
import { PersonalFinanceFoundationsSeeder } from './modules/curriculum/infrastructure/personal-finance-foundations.seeder';
import { BiblicalFormationSeeder } from './modules/curriculum/infrastructure/biblical-formation.seeder';
import { BiblicalFormationIntermediateSeeder } from './modules/curriculum/infrastructure/biblical-formation-intermediate.seeder';
import { BiblicalFormationOriginalLanguagesLiteracySeeder } from './modules/curriculum/infrastructure/biblical-formation-original-languages-literacy.seeder';
import { BiblicalFormationTextTransmissionSeeder } from './modules/curriculum/infrastructure/biblical-formation-text-transmission.seeder';
import { MusicFormationSeeder } from './modules/curriculum/infrastructure/music-formation.seeder';
import { MusicInstrumentsSeeder } from './modules/curriculum/infrastructure/music-instruments.seeder';
import { MusicChristianSeeder } from './modules/curriculum/infrastructure/music-christian.seeder';
import { TradesFormationSeeder } from './modules/curriculum/infrastructure/trades-formation.seeder';
import { TradesWoodworkingConstructionSeeder } from './modules/curriculum/infrastructure/trades-woodworking-construction.seeder';
import { TradesTextileCraftSeeder } from './modules/curriculum/infrastructure/trades-textile-craft.seeder';
import { TradesMechanicalElectricalHomeSeeder } from './modules/curriculum/infrastructure/trades-mechanical-electrical-home.seeder';
import { CookingFormationSeeder } from './modules/curriculum/infrastructure/cooking-formation.seeder';
import { CookingProgressionSeeder } from './modules/curriculum/infrastructure/cooking-progression.seeder';
import { CookingLifeSkillsSeeder } from './modules/curriculum/infrastructure/cooking-life-skills.seeder';
import { GardeningFormationSeeder } from './modules/curriculum/infrastructure/gardening-formation.seeder';
import { GardeningProductionSeeder } from './modules/curriculum/infrastructure/gardening-production.seeder';
import { GardeningManagementPlanningSeeder } from './modules/curriculum/infrastructure/gardening-management-planning.seeder';
import { ResilienceFormationSeeder } from './modules/curriculum/infrastructure/resilience-formation.seeder';
import { ResilienceNavigationCampingSeeder } from './modules/curriculum/infrastructure/resilience-navigation-camping.seeder';
import { ResilienceWaterFireSeeder } from './modules/curriculum/infrastructure/resilience-water-fire.seeder';
import { ResilienceRealEmergenciesSeeder } from './modules/curriculum/infrastructure/resilience-real-emergencies.seeder';
import { FoundationalCurriculumSeeder } from './modules/curriculum/infrastructure/foundational-curriculum.seeder';
import { OfficialCurriculumPacksSeeder } from './modules/curriculum/infrastructure/official-curriculum-packs.seeder';

// Fields that must never appear in logs even if they end up in a logged
// request/response — auth material, secrets, and PII passed through
// request bodies. Paths follow pino's redact syntax (dot-notation into the
// object passed to the logger, `req`/`res` are Fastify's log serializers).
const REDACTED_LOG_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  'req.body.confirmNewPassword',
  'req.body.code',
  'req.body.token',
];

export async function createApplication(): Promise<NestFastifyApplication> {
  const environment = parseEnvironment(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: environment.logLevel,
        redact: { paths: REDACTED_LOG_PATHS, censor: '[redacted]' },
      },
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'requestId',
      genReqId: (req: IncomingMessage) =>
        (req.headers['x-request-id'] as string | undefined) || randomUUID(),
    }),
  );

  app.useLogger(new PinoNestLoggerService(app.getHttpAdapter().getInstance().log));

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableShutdownHooks();
  app.enableCors({
    origin: environment.corsOrigins,
    credentials: true,
  });
  await app.register(helmet);
  await app.register(cookie);

  if (environment.nodeEnv !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Aletheia API')
        .setDescription('Aletheia family logistics API')
        .setVersion('0.1.0')
        .build(),
    );

    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: 'docs-json',
    });
  }

  return app;
}

// Data migrations that are hard requirements for the app to function,
// not optional catalog content -- unlike every other seed:* script in
// this codebase (which stay manual, run only when someone deliberately
// publishes new content), these run automatically on every real server
// boot, tracked by DataMigrationLog so each only ever runs once. Only
// called from bootstrap(), never from createApplication() -- tests
// (which all go through createApplication() directly) are unaffected
// and keep relying on the explicit `seed:*` step already run in CI.
// A catalog-content migration's `run()` just forwards to its seeder's
// existing `seed()` and serializes whatever it returns -- these seeders
// already have varied result shapes (counts, objects, booleans) from
// being written independently over time as standalone `seed:*` scripts,
// and JSON.stringify is enough for the changelog's `notes` column, which
// exists for operators skimming `data_migration_log`, not for parsing.
function toCatalogMigration(code: string, seed: () => Promise<unknown>): { code: string; run: () => Promise<string> } {
  return { code, run: async () => JSON.stringify(await seed()) };
}

async function runDataMigrationsOnBoot(app: NestFastifyApplication): Promise<void> {
  const runner = app.get(DataMigrationRunner);
  const legalConsentSeeder = app.get(LegalConsentDefinitionsSeeder);
  const jurisdictionSeeder = app.get(JurisdictionDefinitionSeeder);

  await runner.run([
    {
      code: 'legal-consent-definitions',
      run: async () => {
        const result = await legalConsentSeeder.seed();
        return `${result.created} created, ${result.existing} already present (total: ${result.total})`;
      },
    },
    {
      code: 'jurisdiction-definitions',
      run: async () => `${await jurisdictionSeeder.seed()} jurisdiction definitions created`,
    },
    // Catalog content -- optional in principle, but once published in one
    // environment it must stay in sync everywhere, so it now follows the
    // same changelog discipline as the two hard requirements above. Each
    // `seed:*` npm script keeps working standalone for manual/DR use;
    // this list just also runs them once on every real boot. Codes match
    // each seeder's existing `seed:<code>` script name and must never be
    // renamed once released.
    toCatalogMigration('pedagogical-models', () => app.get(PedagogicalModelDefinitionSeeder).seed()),
    toCatalogMigration('evidence-types', () => app.get(EvidenceTypeDefinitionSeeder).seed()),
    toCatalogMigration('bible-translations', () => app.get(BibleTranslationDefinitionSeeder).seed()),
    toCatalogMigration('theological-traditions', () => app.get(TheologicalTraditionSeeder).seed()),
    toCatalogMigration('math-subject', () => app.get(MathSubjectSeeder).seed()),
    toCatalogMigration('science-subject', () => app.get(ScienceSubjectSeeder).seed()),
    toCatalogMigration('history-subject', () => app.get(HistorySubjectSeeder).seed()),
    toCatalogMigration('geography-subject', () => app.get(GeographySubjectSeeder).seed()),
    toCatalogMigration('language-subjects', () => app.get(LanguageSubjectSeeder).seed()),
    toCatalogMigration('arts-formation', () => app.get(ArtsFormationSeeder).seed()),
    toCatalogMigration('service-community-formation', () => app.get(ServiceCommunityFormationSeeder).seed()),
    toCatalogMigration('physical-formation', () => app.get(PhysicalFormationSeeder).seed()),
    toCatalogMigration('technology-formation', () => app.get(TechnologyFormationSeeder).seed()),
    toCatalogMigration('vocation-formation', () => app.get(VocationFormationSeeder).seed()),
    toCatalogMigration('home-sufficiency-foundations', () => app.get(HomeSufficiencyFoundationsSeeder).seed()),
    toCatalogMigration('personal-finance-foundations', () => app.get(PersonalFinanceFoundationsSeeder).seed()),
    toCatalogMigration('biblical-formation', () => app.get(BiblicalFormationSeeder).seed()),
    toCatalogMigration('biblical-formation-intermediate', () => app.get(BiblicalFormationIntermediateSeeder).seed()),
    toCatalogMigration('biblical-formation-original-languages-literacy', () =>
      app.get(BiblicalFormationOriginalLanguagesLiteracySeeder).seed()),
    toCatalogMigration('biblical-formation-text-transmission', () =>
      app.get(BiblicalFormationTextTransmissionSeeder).seed()),
    toCatalogMigration('music-formation', () => app.get(MusicFormationSeeder).seed()),
    toCatalogMigration('music-instruments', () => app.get(MusicInstrumentsSeeder).seed()),
    toCatalogMigration('music-christian', () => app.get(MusicChristianSeeder).seed()),
    toCatalogMigration('trades-formation', () => app.get(TradesFormationSeeder).seed()),
    toCatalogMigration('trades-woodworking-construction', () => app.get(TradesWoodworkingConstructionSeeder).seed()),
    toCatalogMigration('trades-textile-craft', () => app.get(TradesTextileCraftSeeder).seed()),
    toCatalogMigration('trades-mechanical-electrical-home', () =>
      app.get(TradesMechanicalElectricalHomeSeeder).seed()),
    toCatalogMigration('cooking-formation', () => app.get(CookingFormationSeeder).seed()),
    toCatalogMigration('cooking-progression', () => app.get(CookingProgressionSeeder).seed()),
    toCatalogMigration('cooking-life-skills', () => app.get(CookingLifeSkillsSeeder).seed()),
    toCatalogMigration('gardening-formation', () => app.get(GardeningFormationSeeder).seed()),
    toCatalogMigration('gardening-production', () => app.get(GardeningProductionSeeder).seed()),
    toCatalogMigration('gardening-management-planning', () => app.get(GardeningManagementPlanningSeeder).seed()),
    toCatalogMigration('resilience-formation', () => app.get(ResilienceFormationSeeder).seed()),
    toCatalogMigration('resilience-navigation-camping', () => app.get(ResilienceNavigationCampingSeeder).seed()),
    toCatalogMigration('resilience-water-fire', () => app.get(ResilienceWaterFireSeeder).seed()),
    toCatalogMigration('resilience-real-emergencies', () => app.get(ResilienceRealEmergenciesSeeder).seed()),
    // These two compose the seeders above, so they must run last.
    toCatalogMigration('foundational-curriculum', () => app.get(FoundationalCurriculumSeeder).seed()),
    toCatalogMigration('curriculum-packs', () => app.get(OfficialCurriculumPacksSeeder).seed()),
  ]);
}

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  await runDataMigrationsOnBoot(app);
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

if (require.main === module) {
  void bootstrap();
}
