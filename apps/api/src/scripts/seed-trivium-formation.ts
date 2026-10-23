import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { TriviumFormationSeeder } from '../modules/curriculum/infrastructure/trivium-formation.seeder.js';

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const result = await app.get(TriviumFormationSeeder).seed();
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result));
  } finally {
    await app.close();
  }
}

void main();
