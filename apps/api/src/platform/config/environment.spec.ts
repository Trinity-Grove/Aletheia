import { parseEnvironment } from './environment.js';

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

  it('rejects partial object storage configuration', () => {
    expect(() =>
      parseEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_ACCESS_KEY: 'minioadmin',
      }),
    ).toThrow('Object storage configuration is incomplete');
  });

  it('accepts full object storage configuration', () => {
    expect(
      parseEnvironment({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/aletheia',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_ACCESS_KEY: 'minioadmin',
        S3_SECRET_KEY: 'minioadmin',
        S3_BUCKET: 'aletheia',
      }),
    ).toMatchObject({
      objectStorage: {
        endpoint: 'http://localhost:9000',
        accessKey: 'minioadmin',
        secretKey: 'minioadmin',
        bucket: 'aletheia',
      },
    });
  });
});
