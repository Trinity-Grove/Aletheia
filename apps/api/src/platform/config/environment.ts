import { z } from 'zod';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';

export interface Environment {
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: LogLevel;
  databaseUrl: string;
  redisUrl: string | null;
  jwtSecret: string;
  learnerSessionJwtSecret: string;
  mfaEncryptionKey: string;
  corsOrigins: string[];
  resendApiKey: string | null;
  mailFromAddress: string;
  webOrigin: string;
  // Bootstrap list for the platform-admin role (issue #101). Checked at
  // register/login -- any user whose email matches gets isPlatformAdmin
  // promoted to true if it wasn't already. Never used to demote: removing
  // an email from this list does not revoke an already-granted flag.
  platformAdminEmails: string[];
  objectStorage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region?: string | undefined;
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
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),
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
    LEARNER_SESSION_JWT_SECRET: z.preprocess(
      (value) => value ?? '',
      z
        .string()
        .trim()
        .min(16, 'LEARNER_SESSION_JWT_SECRET is required and must be at least 16 characters long'),
    ),
    MFA_ENCRYPTION_KEY: z.preprocess(
      (value) => value ?? '',
      z
        .string()
        .trim()
        .regex(/^[0-9a-f]{64}$/i, 'MFA_ENCRYPTION_KEY is required and must be a 64-character hex string (32 bytes)'),
    ),
    CORS_ORIGIN: optionalValue,
    PLATFORM_ADMIN_EMAILS: optionalValue,
    RESEND_API_KEY: optionalValue,
    MAIL_FROM_ADDRESS: optionalValue,
    WEB_ORIGIN: optionalUrl,
    REDIS_URL: optionalUrl,
    S3_ENDPOINT: optionalUrl,
    S3_ACCESS_KEY: optionalValue,
    S3_ACCESS_KEY_ID: optionalValue,
    S3_SECRET_KEY: optionalValue,
    S3_SECRET_ACCESS_KEY: optionalValue,
    S3_BUCKET: optionalValue,
    S3_REGION: optionalValue,
  })
  .superRefine((environment, context) => {
    if (
      environment.JWT_SECRET &&
      environment.LEARNER_SESSION_JWT_SECRET &&
      environment.JWT_SECRET === environment.LEARNER_SESSION_JWT_SECRET
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'LEARNER_SESSION_JWT_SECRET must differ from JWT_SECRET -- a learner session token must never be verifiable as a guardian session token.',
        path: ['LEARNER_SESSION_JWT_SECRET'],
      });
    }

    const effectiveAccessKey =
      environment.S3_ACCESS_KEY ?? environment.S3_ACCESS_KEY_ID;
    const effectiveSecretKey =
      environment.S3_SECRET_KEY ?? environment.S3_SECRET_ACCESS_KEY;

    const objectStorageValues = [
      environment.S3_ENDPOINT,
      effectiveAccessKey,
      effectiveSecretKey,
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
      logLevel:
        environment.LOG_LEVEL ??
        (environment.NODE_ENV === 'test'
          ? 'silent'
          : environment.NODE_ENV === 'production'
            ? 'info'
            : 'debug'),
      databaseUrl: environment.DATABASE_URL,
      redisUrl: environment.REDIS_URL ?? null,
      jwtSecret: environment.JWT_SECRET,
      learnerSessionJwtSecret: environment.LEARNER_SESSION_JWT_SECRET,
      mfaEncryptionKey: environment.MFA_ENCRYPTION_KEY,
      corsOrigins: environment.CORS_ORIGIN
        ? environment.CORS_ORIGIN.split(',')
            .map((origin) => origin.trim())
            .filter((origin) => origin.length > 0)
        : ['http://localhost:3000'],
      platformAdminEmails: environment.PLATFORM_ADMIN_EMAILS
        ? environment.PLATFORM_ADMIN_EMAILS.split(',')
            .map((email) => email.trim().toLowerCase())
            .filter((email) => email.length > 0)
        : [],
      resendApiKey: environment.RESEND_API_KEY ?? null,
      mailFromAddress: environment.MAIL_FROM_ADDRESS ?? 'Aletheia <onboarding@resend.dev>',
      webOrigin: environment.WEB_ORIGIN ?? 'http://localhost:3000',
      objectStorage: environment.S3_ENDPOINT
        ? {
            endpoint: environment.S3_ENDPOINT,
            accessKey: (environment.S3_ACCESS_KEY ?? environment.S3_ACCESS_KEY_ID)!,
            secretKey: (environment.S3_SECRET_KEY ?? environment.S3_SECRET_ACCESS_KEY)!,
            bucket: environment.S3_BUCKET!,
            region: environment.S3_REGION,
          }
        : null,
    }),
  );

export function parseEnvironment(
  rawEnvironment: Record<string, string | undefined>,
): Environment {
  return environmentSchema.parse(rawEnvironment);
}
