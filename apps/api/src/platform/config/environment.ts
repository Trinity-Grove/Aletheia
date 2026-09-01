import { z } from 'zod';

export interface Environment {
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  redisUrl: string | null;
  jwtSecret: string;
  corsOrigins: string[];
  resendApiKey: string | null;
  mailFromAddress: string;
  webOrigin: string;
  objectStorage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
  } | null;
}

export const ENVIRONMENT = Symbol('ENVIRONMENT');

function normalizeOptionalValue(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

const optionalUrl = z.preprocess(
  normalizeOptionalValue,
  z.url().optional(),
);

const optionalValue = z.preprocess(
  normalizeOptionalValue,
  z.string().trim().min(1).optional(),
);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.preprocess(
      (value) => value ?? '',
      z.string().trim().min(1, 'DATABASE_URL is required').pipe(z.url()),
    ),
    JWT_SECRET: z.preprocess(
      (value) => value ?? '',
      z
        .string()
        .trim()
        .min(16, 'JWT_SECRET is required and must be at least 16 characters long'),
    ),
    CORS_ORIGIN: optionalValue,
    RESEND_API_KEY: optionalValue,
    MAIL_FROM_ADDRESS: optionalValue,
    WEB_ORIGIN: optionalUrl,
    REDIS_URL: optionalUrl,
    S3_ENDPOINT: optionalUrl,
    S3_ACCESS_KEY: optionalValue,
    S3_SECRET_KEY: optionalValue,
    S3_BUCKET: optionalValue,
  })
  .superRefine((environment, context) => {
    const objectStorageValues = [
      environment.S3_ENDPOINT,
      environment.S3_ACCESS_KEY,
      environment.S3_SECRET_KEY,
      environment.S3_BUCKET,
    ];
    const configuredValues = objectStorageValues.filter(
      (value) => value !== undefined,
    );

    if (
      configuredValues.length > 0 &&
      configuredValues.length < objectStorageValues.length
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Object storage configuration is incomplete',
        path: ['S3_ENDPOINT'],
      });
    }
  })
  .transform(
    (environment): Environment => ({
      nodeEnv: environment.NODE_ENV,
      databaseUrl: environment.DATABASE_URL,
      redisUrl: environment.REDIS_URL ?? null,
      jwtSecret: environment.JWT_SECRET,
      corsOrigins: environment.CORS_ORIGIN
        ? environment.CORS_ORIGIN.split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin.length > 0)
        : ['http://localhost:3000'],
      resendApiKey: environment.RESEND_API_KEY ?? null,
      mailFromAddress: environment.MAIL_FROM_ADDRESS ?? 'Aletheia <onboarding@resend.dev>',
      webOrigin: environment.WEB_ORIGIN ?? 'http://localhost:3000',
      objectStorage: environment.S3_ENDPOINT
        ? {
            endpoint: environment.S3_ENDPOINT,
            accessKey: environment.S3_ACCESS_KEY!,
            secretKey: environment.S3_SECRET_KEY!,
            bucket: environment.S3_BUCKET!,
          }
        : null,
    }),
  );

export function parseEnvironment(
  rawEnvironment: Record<string, string | undefined>,
): Environment {
  return environmentSchema.parse(rawEnvironment);
}
