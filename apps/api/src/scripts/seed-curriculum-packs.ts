import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { OfficialCurriculumPacksSeeder } from '../modules/curriculum/infrastructure/official-curriculum-packs.seeder.js';

// Standalone maintenance entry point to seed the official curriculum packs
// into the platform catalog so families can discover and install them.
// Invoked via `pnpm --filter @aletheia/api run seed:curriculum-packs`.
// Safe to re-run: existing rows are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(OfficialCurriculumPacksSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Curriculum packs seed complete: ${result.created} created, ${result.existing} already present (total: ${result.total}).`,
    );
  } finally {
    await app.close();
  }
}

void main();
