import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { BiblicalFormationIntermediateSeeder } from '../modules/curriculum/infrastructure/biblical-formation-intermediate.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:biblical-formation-intermediate`
// to (re)publish the intermediate-tier "Progressão" path under the
// existing "Formação Bíblica" domain. Safe to re-run: existing rows
// (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(BiblicalFormationIntermediateSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Biblical formation intermediate seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
