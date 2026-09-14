import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { BiblicalFormationSeeder } from '../modules/curriculum/infrastructure/biblical-formation.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-pedagogical-model-definitions.ts. Invoked
// via `pnpm --filter @aletheia/api run seed:biblical-formation` to
// (re)publish the "Formação Bíblica" introductory-tier domain/path/
// competencies from issue #95 section 5. Safe to re-run: existing rows
// (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(BiblicalFormationSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Biblical formation seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
