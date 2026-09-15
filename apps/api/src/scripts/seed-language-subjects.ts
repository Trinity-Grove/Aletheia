import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { LanguageSubjectSeeder } from '../modules/curriculum/infrastructure/language-subject.seeder.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(LanguageSubjectSeeder).seed();
    // eslint-disable-next-line no-console
    console.log(
      `Language subject seed: ${result.domainsCreated} domain(s), ${result.pathsCreated} path(s), ` +
        `${result.competenciesCreated} competency definition(s) created.`,
    );
  } finally {
    await app.close();
  }
}

void main();
