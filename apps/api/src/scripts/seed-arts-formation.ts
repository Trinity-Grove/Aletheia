import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { ArtsFormationSeeder } from '../modules/curriculum/infrastructure/arts-formation.seeder.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(ArtsFormationSeeder).seed();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

void main();
