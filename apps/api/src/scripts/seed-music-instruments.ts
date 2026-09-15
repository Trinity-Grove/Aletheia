import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { MusicInstrumentsSeeder } from '../modules/curriculum/infrastructure/music-instruments.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-music-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:music-instruments` to (re)publish
// the nine per-instrument "Instrumentos" LearningPaths from issue #95
// section 13. Safe to re-run: existing rows (matched by code) are left
// untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(MusicInstrumentsSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Music instruments seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `${result.pathsCreated} new learning path(s) created, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
