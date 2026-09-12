import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { BibleTranslationDefinitionSeeder } from '../modules/curriculum/infrastructure/bible-translation-definition.seeder.js';

// Standalone maintenance entry point -- same pattern as
// seed-evidence-type-definitions.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:bible-translations` to
// (re)publish bible_translation_definitions rows sourced from the same
// catalog the devotional module's YouVersionService already uses. Safe
// to re-run: upserts by (code, version).
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(BibleTranslationDefinitionSeeder);
    const count = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(`Seeded ${count} bible translation definition(s).`);
  } finally {
    await app.close();
  }
}

void main();
