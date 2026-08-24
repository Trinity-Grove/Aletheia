import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
});

export interface Environment {
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  redisUrl: string | null;
  objectStorage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
  } | null;
}

export function parseEnvironment(raw: Record<string, string | undefined>): Environment {
  if (!raw.DATABASE_URL || typeof raw.DATABASE_URL !== 'string' || raw.DATABASE_URL.trim() === '') {
    throw new Error('DATABASE_URL is required');
  }

  const parsed = environmentSchema.safeParse(raw);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues.map((i) => i.message).join(', ');
    throw new Error(errorMsg);
  }

  const {
    NODE_ENV,
    DATABASE_URL,
    REDIS_URL,
    S3_ENDPOINT,
    S3_ACCESS_KEY,
    S3_SECRET_KEY,
    S3_BUCKET,
  } = parsed.data;

  const s3Fields = [S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET];
  const presentS3Fields = s3Fields.filter((f) => f !== undefined && f.trim() !== '');

  let objectStorage: Environment['objectStorage'] = null;
  if (presentS3Fields.length > 0) {
    if (presentS3Fields.length !== 4) {
      throw new Error('Object storage configuration is incomplete');
    }
    objectStorage = {
      endpoint: S3_ENDPOINT!,
      accessKey: S3_ACCESS_KEY!,
      secretKey: S3_SECRET_KEY!,
      bucket: S3_BUCKET!,
    };
  }

  return {
    nodeEnv: NODE_ENV,
    databaseUrl: DATABASE_URL,
    redisUrl: REDIS_URL && REDIS_URL.trim() !== '' ? REDIS_URL : null,
    objectStorage,
  };
}
