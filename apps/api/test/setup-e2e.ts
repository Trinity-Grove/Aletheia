process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/aletheia_test?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
process.env.MFA_ENCRYPTION_KEY =
  process.env.MFA_ENCRYPTION_KEY ||
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
