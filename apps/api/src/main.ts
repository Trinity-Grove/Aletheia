import 'reflect-metadata';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'node:process';
import { AppModule } from './app.module';

export async function createApplication(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableShutdownHooks();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Aletheia API')
      .setDescription('Aletheia family logistics API')
      .setVersion('0.1.0')
      .build(),
  );

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
  });

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
}

if (require.main === module) {
  void bootstrap();
}
