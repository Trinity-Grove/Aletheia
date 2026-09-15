import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { BiblicalFormationOriginalLanguagesLiteracySeeder } from '../modules/curriculum/infrastructure/biblical-formation-original-languages-literacy.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:biblical-formation-original-languages-literacy`
// to (re)publish the original-languages-literacy path under the existing
// "Formação Bíblica" domain. Safe to re-run: existing rows (matched by
// code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(BiblicalFormationOriginalLanguagesLiteracySeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Biblical formation original-languages-literacy seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
