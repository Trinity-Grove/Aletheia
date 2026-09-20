import { Inject, Injectable, Module } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import * as process from 'node:process';
import { AppModule } from '../../app.module.js';
import {
  ENVIRONMENT,
  type Environment,
  parseEnvironment,
} from './environment.js';

// AppModule pulls in IdentityModule -> AuthService -> otplib transitively.
// otplib v13 ships ESM-only runtime deps that ts-jest can't transform, so
// this suite mocks it the same way auth.service.spec.ts does — it only
// needs DI wiring to succeed, never real TOTP math.
jest.mock('otplib', () => ({
  generateSecret: jest.fn(() => 'FAKESECRET'),
  generateURI: jest.fn(() => 'otpauth://totp/Aletheia:user?secret=FAKESECRET'),
  verifySync: jest.fn(() => ({ valid: false, delta: undefined })),
}));

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
  const validJwtSecret = 'unit_test_jwt_secret_key_1234567890';
  const validLearnerJwtSecret = 'unit_test_learner_jwt_secret_key_0987654321';
  const validMfaEncryptionKey = '0123456789abcdef'.repeat(4);

  it('rejects a missing database URL', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'development',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
      }),
    ).toThrow('DATABASE_URL is required');
  });

  it('rejects a missing JWT secret', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
      }),
    ).toThrow('JWT_SECRET is required');
  });

  it('rejects a JWT secret shorter than 16 characters', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: 'too-short',
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
      }),
    ).toThrow('JWT_SECRET is required and must be at least 16 characters long');
  });

  it('rejects a missing learner session JWT secret', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
      }),
    ).toThrow('LEARNER_SESSION_JWT_SECRET is required');
  });

  it('rejects a learner session JWT secret identical to the guardian JWT secret', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validJwtSecret,
      }),
    ).toThrow('LEARNER_SESSION_JWT_SECRET must differ from JWT_SECRET');
  });

  it.each([
    ['development', 'debug'],
    ['production', 'info'],
    ['test', 'silent'],
  ] as const)('defaults LOG_LEVEL to %s for %s', (nodeEnv, expectedLevel) => {
    const result = parseEnvironment({
      NODE_ENV: nodeEnv,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
      JWT_SECRET: validJwtSecret,
      LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
      MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
    });
    expect(result.logLevel).toBe(expectedLevel);
  });

  it('honors an explicit LOG_LEVEL override', () => {
    const result = parseEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
      JWT_SECRET: validJwtSecret,
      LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
      MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
      LOG_LEVEL: 'warn',
    });
    expect(result.logLevel).toBe('warn');
  });

  it('does not require optional infrastructure for API startup', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
      }),
    ).toMatchObject({
      nodeEnv: 'test',
      databaseUrl: expect.any(String),
      redisUrl: null,
      objectStorage: null,
      corsOrigins: ['http://localhost:3000'],
    });
  });

  it('splits a comma-separated CORS_ORIGIN into a trimmed list', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
        CORS_ORIGIN: 'https://app.example.com, https://admin.example.com ',
      }),
    ).toMatchObject({
      corsOrigins: ['https://app.example.com', 'https://admin.example.com'],
    });
  });

  it('defaults platformAdminEmails to an empty list when unset', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
      }),
    ).toMatchObject({ platformAdminEmails: [] });
  });

  it('splits and lowercases a comma-separated PLATFORM_ADMIN_EMAILS list', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
        PLATFORM_ADMIN_EMAILS: ' Admin@Example.com, second@example.com ',
      }),
    ).toMatchObject({
      platformAdminEmails: ['admin@example.com', 'second@example.com'],
    });
  });

  it('splits, normalizes and lowercases a comma-separated PLATFORM_ADMIN_DOMAINS list', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
        PLATFORM_ADMIN_DOMAINS: ' @trinitygrove.org, AletheiaPhos.App ',
      }),
    ).toMatchObject({
      platformAdminDomains: ['trinitygrove.org', 'aletheiaphos.app'],
    });
  });

  it('defaults mail configuration to the console fallback sender', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
      }),
    ).toMatchObject({
      resendApiKey: null,
      mailFromAddress: 'Aletheia <onboarding@resend.dev>',
      webOrigin: 'http://localhost:3000',
    });
  });

  it('maps a configured Resend API key and mail settings', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
        RESEND_API_KEY: 're_test_key_123',
        MAIL_FROM_ADDRESS: 'Aletheia <hello@aletheia.family>',
        WEB_ORIGIN: 'https://app.aletheia.family',
      }),
    ).toMatchObject({
      resendApiKey: 're_test_key_123',
      mailFromAddress: 'Aletheia <hello@aletheia.family>',
      webOrigin: 'https://app.aletheia.family',
    });
  });

  it('maps fully configured optional infrastructure', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@db:5432/aletheia',
        JWT_SECRET: validJwtSecret,
        LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
        MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
        CORS_ORIGIN: 'https://app.example.com',
        REDIS_URL: 'redis://cache:6379',
        S3_ENDPOINT: 'https://objects.example.com',
        S3_ACCESS_KEY: 'access-key',
        S3_SECRET_KEY: 'secret-key',
        S3_BUCKET: 'aletheia',
      }),
    ).toEqual({
      nodeEnv: 'production',
      logLevel: 'info',
      databaseUrl: 'postgresql://user:pass@db:5432/aletheia',
      redisUrl: 'redis://cache:6379',
      jwtSecret: validJwtSecret,
      learnerSessionJwtSecret: validLearnerJwtSecret,
      mfaEncryptionKey: validMfaEncryptionKey,
      corsOrigins: ['https://app.example.com'],
      platformAdminEmails: [],
      platformAdminDomains: [],
      resendApiKey: null,
      mailFromAddress: 'Aletheia <onboarding@resend.dev>',
      webOrigin: 'http://localhost:3000',
      objectStorage: {
        endpoint: 'https://objects.example.com',
        accessKey: 'access-key',
        secretKey: 'secret-key',
        bucket: 'aletheia',
        region: undefined,
      },
    });
  });

  it('maps object storage configured with AWS SDK standard variable names (S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION)', () => {
    const environment = parseEnvironment({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db:5432/aletheia',
      JWT_SECRET: validJwtSecret,
      LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
      MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
      S3_ENDPOINT: 'https://objects.example.com',
      S3_ACCESS_KEY_ID: 'aws-access-key-id',
      S3_SECRET_ACCESS_KEY: 'aws-secret-access-key',
      S3_BUCKET: 'aletheia',
      S3_REGION: 'sjc',
    });

    expect(environment.objectStorage).toEqual({
      endpoint: 'https://objects.example.com',
      accessKey: 'aws-access-key-id',
      secretKey: 'aws-secret-access-key',
      bucket: 'aletheia',
      region: 'sjc',
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
          JWT_SECRET: validJwtSecret,
          LEARNER_SESSION_JWT_SECRET: validLearnerJwtSecret,
          MFA_ENCRYPTION_KEY: validMfaEncryptionKey,
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
      'JWT_SECRET',
      'LEARNER_SESSION_JWT_SECRET',
      'MFA_ENCRYPTION_KEY',
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
    process.env.JWT_SECRET = validJwtSecret;
    process.env.LEARNER_SESSION_JWT_SECRET = validLearnerJwtSecret;
    process.env.MFA_ENCRYPTION_KEY = validMfaEncryptionKey;
    for (const name of variableNames.slice(5)) {
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
        corsOrigins: ['http://localhost:3000'],
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
