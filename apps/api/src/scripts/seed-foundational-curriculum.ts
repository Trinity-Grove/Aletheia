import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { FoundationalCurriculumSeeder } from '../modules/curriculum/infrastructure/foundational-curriculum.seeder.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(FoundationalCurriculumSeeder).seed();
    // eslint-disable-next-line no-console
    console.log(
      `Foundational curriculum seed: curriculum ${result.curriculumCreated ? 'created' : 'already present'}, ` +
        `policy ${result.policyCreated ? 'created' : 'already present'}, ` +
        `${result.domainsLinked} domain(s) and ${result.competenciesLinked} competency(ies) linked.`,
    );
  } finally {
    await app.close();
  }
}

void main();
