import { describe, expect, it } from '@jest/globals';
import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as process from 'node:process';
import { AppModule } from '../../app.module';
import {
  ENVIRONMENT,
  type Environment,
  parseEnvironment,
} from './environment';

@Injectable()
class EnvironmentConsumer {
  readonly environment: Environment;

  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    this.environment = environment;
  }
}

@Module({ providers: [EnvironmentConsumer] })
class EnvironmentConsumerModule {}

describe('parseEnvironment', () => {
  it('rejects a missing database URL', () => {
    expect(() => parseEnvironment({ NODE_ENV: 'development' })).toThrow(
      'DATABASE_URL is required',
    );
  });

  it('does not require optional infrastructure for API startup', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
      }),
    ).toMatchObject({
      nodeEnv: 'test',
      databaseUrl: expect.any(String),
      redisUrl: null,
      objectStorage: null,
    });
  });

  it('maps fully configured optional infrastructure', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@db:5432/aletheia',
        REDIS_URL: 'redis://cache:6379',
        S3_ENDPOINT: 'https://objects.example.com',
        S3_ACCESS_KEY: 'access-key',
        S3_SECRET_KEY: 'secret-key',
        S3_BUCKET: 'aletheia',
      }),
    ).toEqual({
      nodeEnv: 'production',
      databaseUrl: 'postgresql://user:pass@db:5432/aletheia',
      redisUrl: 'redis://cache:6379',
      objectStorage: {
        endpoint: 'https://objects.example.com',
        accessKey: 'access-key',
        secretKey: 'secret-key',
        bucket: 'aletheia',
      },
    });
  });

  it.each([
    { field: 'S3_ENDPOINT', value: '', kind: 'empty' },
    { field: 'S3_ENDPOINT', value: '   ', kind: 'whitespace-only' },
    { field: 'S3_ACCESS_KEY', value: '', kind: 'empty' },
    { field: 'S3_ACCESS_KEY', value: '   ', kind: 'whitespace-only' },
    { field: 'S3_SECRET_KEY', value: '', kind: 'empty' },
    { field: 'S3_SECRET_KEY', value: '   ', kind: 'whitespace-only' },
    { field: 'S3_BUCKET', value: '', kind: 'empty' },
    { field: 'S3_BUCKET', value: '   ', kind: 'whitespace-only' },
  ] as const)(
    'rejects $field when it is $kind as incomplete',
    ({ field, value }) => {
      expect(() =>
        parseEnvironment({
          NODE_ENV: 'development',
          DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
          S3_ENDPOINT: 'http://localhost:9000',
          S3_ACCESS_KEY: 'access-key',
          S3_SECRET_KEY: 'secret-key',
          S3_BUCKET: 'aletheia',
          [field]: value,
        }),
      ).toThrow('Object storage configuration is incomplete');
    },
  );

  it('injects the validated environment into an application consumer module', async () => {
    const variableNames = [
      'NODE_ENV',
      'DATABASE_URL',
      'REDIS_URL',
      'S3_ENDPOINT',
      'S3_ACCESS_KEY',
      'S3_SECRET_KEY',
      'S3_BUCKET',
    ] as const;
    const previousValues = Object.fromEntries(
      variableNames.map((name) => [name, process.env[name]]),
    );

    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://user:pass@localhost:5432/aletheia';
    for (const name of variableNames.slice(2)) {
      delete process.env[name];
    }

    let moduleRef: TestingModule | undefined;

    try {
      moduleRef = await Test.createTestingModule({
        imports: [AppModule, EnvironmentConsumerModule],
      }).compile();

      expect(moduleRef.get(EnvironmentConsumer).environment).toMatchObject({
        nodeEnv: 'test',
        databaseUrl: 'postgresql://user:pass@localhost:5432/aletheia',
        redisUrl: null,
        objectStorage: null,
      });
    } finally {
      await moduleRef?.close();
      for (const name of variableNames) {
        const previousValue = previousValues[name];
        if (previousValue === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = previousValue;
        }
      }
    }
  });
});
