import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { TradesTextileCraftSeeder } from '../modules/curriculum/infrastructure/trades-textile-craft.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:trades-textile-craft` to
// (re)publish the textile/craft trade paths (Costura, Artesanato,
// Pintura Residencial) under the existing "Ofícios" domain. Safe to
// re-run: existing rows (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(TradesTextileCraftSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Trades (textile/craft) seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `${result.pathsCreated} new path(s) created, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
