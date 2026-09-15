import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PersonalFinanceFoundationsSeeder } from '../modules/curriculum/infrastructure/personal-finance-foundations.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-home-sufficiency-foundations.ts /
// seed-gardening-formation.ts / seed-cooking-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:personal-finance-foundations` to
// (re)publish the "Educação Financeira Prática" foundational domain/
// path/competencies from issue #95 section 22. Safe to re-run: existing
// rows (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(PersonalFinanceFoundationsSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Personal finance foundations seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
