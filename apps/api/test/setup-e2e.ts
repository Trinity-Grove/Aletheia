process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/aletheia_test?schema=public';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test_jwt_secret_key_1234567890';
