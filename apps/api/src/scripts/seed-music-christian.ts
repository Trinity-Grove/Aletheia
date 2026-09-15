import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { MusicChristianSeeder } from '../modules/curriculum/infrastructure/music-christian.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-music-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:music-christian` to (re)publish
// the "Música e Cristianismo" LearningPath from issue #95 section 13.
// Safe to re-run: existing rows (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(MusicChristianSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Music/Christian music seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
