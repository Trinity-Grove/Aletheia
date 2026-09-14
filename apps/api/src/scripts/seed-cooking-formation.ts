import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { CookingFormationSeeder } from '../modules/curriculum/infrastructure/cooking-formation.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-biblical-formation.ts /
// seed-music-formation.ts / seed-trades-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:cooking-formation` to (re)publish
// the "Culinária" foundational domain/path/competencies from issue #95
// section 18. Safe to re-run: existing rows (matched by code) are left
// untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(CookingFormationSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Cooking formation seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
