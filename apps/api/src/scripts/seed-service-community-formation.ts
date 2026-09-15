import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { ServiceCommunityFormationSeeder } from '../modules/curriculum/infrastructure/service-community-formation.seeder.js';

// Standalone maintenance entry point -- not wired into the running API
// process, same pattern as seed-physical-formation.ts /
// seed-gardening-formation.ts. Invoked via
// `pnpm --filter @aletheia/api run seed:service-community-formation` to
// (re)publish the "Serviço e Comunidade" foundational domain/path/
// competencies from issue #95 section 24. Safe to re-run: existing rows
// (matched by code) are left untouched.
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const seeder = app.get(ServiceCommunityFormationSeeder);
    const result = await seeder.seed();
    // eslint-disable-next-line no-console
    console.log(
      `Service/community formation seed: domain ${result.domainCreated ? 'created' : 'already present'}, ` +
        `path ${result.pathCreated ? 'created' : 'already present'}, ` +
        `${result.competenciesCreated} new competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
