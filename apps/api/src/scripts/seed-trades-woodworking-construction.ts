import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { TradesWoodworkingConstructionSeeder } from '../modules/curriculum/infrastructure/trades-woodworking-construction.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as the other seed-*.ts scripts. Invoked via
// `pnpm --filter @aletheia/api run seed:trades-woodworking-construction`
// to (re)publish the woodworking/construction trade paths (Marcenaria,
// Carpintaria, Construção Simples, Ferramentas Manuais) under the
// existing "Ofícios" domain. Safe to re-run: existing rows (matched by
// code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(TradesWoodworkingConstructionSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Trades (woodworking/construction) seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `${result.pathsCreated} new path(s) created, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
