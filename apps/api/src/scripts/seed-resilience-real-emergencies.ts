import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { ResilienceRealEmergenciesSeeder } from '../modules/curriculum/infrastructure/resilience-real-emergencies.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:resilience-real-emergencies` to
// (re)publish the Emergências Reais path under the existing "Resiliência,
// Outdoor e Preparação Familiar" domain. Safe to re-run: existing rows
// (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(ResilienceRealEmergenciesSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Resilience (real emergencies) seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `${result.pathsCreated} new path(s) created, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
