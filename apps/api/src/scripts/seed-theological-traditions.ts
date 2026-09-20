import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { TheologicalTraditionSeeder } from '../modules/curriculum/infrastructure/theological-tradition.seeder.js';

// Standalone maintenance entry point -- same pattern as
// seed-pedagogical-model-definitions.ts and seed-evidence-type-definitions.ts.
// Invoked via `pnpm --filter @aletheia/api run seed:theological-traditions` to
// (re)publish the baseline theological tradition definition rows (issues #95, #96).
// Safe to re-run: upserts by (code, version).
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(TheologicalTraditionSeeder);
    const count = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(`Seeded ${count} theological tradition definition(s).`);
  } finally {
    await app.close();
  }
}

void main();
