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
