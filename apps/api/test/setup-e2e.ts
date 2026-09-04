process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/aletheia_test?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
process.env.MFA_ENCRYPTION_KEY =
  process.env.MFA_ENCRYPTION_KEY ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
// ObjectStorageService (issue #29) requires these to construct at all —
// without them, every spec that boots RecordsModule (nearly all of them,
// transitively through AppModule) fails before it even runs. Matches the
// local MinIO credentials in infra/env.example.
process.env.S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://127.0.0.1:9000';
process.env.S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || 'aletheia';
process.env.S3_SECRET_KEY = process.env.S3_SECRET_KEY || 'aletheia_local_only';
process.env.S3_BUCKET = process.env.S3_BUCKET || 'aletheia';
