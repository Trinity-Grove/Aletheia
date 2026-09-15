import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { GardeningProductionSeeder } from '../modules/curriculum/infrastructure/gardening-production.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:gardening-production` to
// (re)publish the Produção path under the existing "Plantio" domain. Safe
// to re-run: existing rows (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(GardeningProductionSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Gardening (production) seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
