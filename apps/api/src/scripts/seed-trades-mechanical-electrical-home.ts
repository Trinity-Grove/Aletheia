import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { TradesMechanicalElectricalHomeSeeder } from '../modules/curriculum/infrastructure/trades-mechanical-electrical-home.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:trades-mechanical-electrical-home`
// to (re)publish the mechanical/electrical/home maintenance trade paths
// (Mecânica Básica, Elétrica Básica, Manutenção Residencial) under the
// existing "Ofícios" domain. Safe to re-run: existing rows (matched by
// code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(TradesMechanicalElectricalHomeSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Trades (mechanical/electrical/home maintenance) seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `${result.pathsCreated} new path(s) created, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
