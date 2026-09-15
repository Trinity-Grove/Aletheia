import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PhysicalFormationSeeder } from '../modules/curriculum/infrastructure/physical-formation.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-gardening-formation.ts /
// seed-resilience-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:physical-formation` to
// (re)publish the "Formação Física" foundational domain/path/
// competencies from issue #95 section 23. Safe to re-run: existing rows
// (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(PhysicalFormationSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Physical formation seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
