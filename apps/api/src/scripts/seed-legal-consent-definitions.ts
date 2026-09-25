import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { LegalConsentDefinitionsSeeder } from '../modules/privacy/infrastructure/legal-consent-definitions.seeder.js';

// Standalone maintenance entry point to seed the Terms of Use, Privacy
// Policy, and learner-data-processing consent definitions (LGPD/GDPR/
// GENERIC variants) into the catalog, so registration and learner
// creation have real published terms to reference.
// Invoked via `pnpm --filter @aletheia/api run seed:legal-consent-definitions`.
// Safe to re-run: existing rows are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(LegalConsentDefinitionsSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Legal consent definitions seed complete: ${result.created} created, ${result.existing} already present (total: ${result.total}).`,
    );
  } finally {
    await app.close();
  }
}

void main();
