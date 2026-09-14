import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { GardeningFormationSeeder } from '../modules/curriculum/infrastructure/gardening-formation.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-biblical-formation.ts /
// seed-music-formation.ts / seed-trades-formation.ts /
// seed-cooking-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:gardening-formation` to
// (re)publish the "Plantio" foundational domain/path/competencies from
// issue #95 section 19. Safe to re-run: existing rows (matched by code)
// are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(GardeningFormationSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Gardening formation seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
