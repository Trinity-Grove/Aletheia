import { Readable } from 'node:stream';
import type { Environment } from '../config/environment.js';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  HeadBucketCommand: jest.fn((input) => ({ ...input, type: 'HeadBucketCommand' })),
  CreateBucketCommand: jest.fn((input) => ({ ...input, type: 'CreateBucketCommand' })),
  PutBucketCorsCommand: jest.fn((input) => ({ ...input, type: 'PutBucketCorsCommand' })),
  PutObjectCommand: jest.fn((input) => ({ ...input, type: 'PutObjectCommand' })),
  GetObjectCommand: jest.fn((input) => ({ ...input, type: 'GetObjectCommand' })),
  ListObjectsV2Command: jest.fn((input) => ({ ...input, type: 'ListObjectsV2Command' })),
  DeleteObjectCommand: jest.fn((input) => ({ ...input, type: 'DeleteObjectCommand' })),
  HeadObjectCommand: jest.fn((input) => ({ ...input, type: 'HeadObjectCommand' })),
}));

// Import after jest.mock to ensure mocked S3Client is used
import { ObjectStorageService } from './object-storage.service.js';

describe('ObjectStorageService', () => {
  const environment: Environment = {
    nodeEnv: 'test',
    logLevel: 'silent',
    databaseUrl: 'postgresql://postgres:postgres@localhost:5432/aletheia_test',
    redisUrl: null,
    jwtSecret: 'test_jwt_secret_1234567890',
    learnerSessionJwtSecret: 'test_learner_jwt_secret_1234567890',
    mfaEncryptionKey: '0000000000000000000000000000000000000000000000000000000000000000',
    corsOrigins: ['http://localhost:3000'],
    platformAdminEmails: [],
    platformAdminDomains: [],
    resendApiKey: null,
    mailFromAddress: 'test@example.com',
    webOrigin: 'http://localhost:3000',
    objectStorage: {
      endpoint: 'https://s3.example.com',
      accessKey: 'access-key',
      secretKey: 'secret-key',
      bucket: 'test-bucket',
    },
  };

  let service: ObjectStorageService;

  beforeEach(() => {
    mockSend.mockReset();
    service = new ObjectStorageService(environment);
  });

  it('throws an error if object storage is accessed but not configured', async () => {
    const unconfiguredService = new ObjectStorageService({
      ...environment,
      objectStorage: null,
    });

    await expect(unconfiguredService.checkHealth()).rejects.toThrow(
      'Object storage is not configured',
    );
  });

  it('checks bucket health with HeadBucketCommand', async () => {
    mockSend.mockResolvedValueOnce({});

    await service.checkHealth();

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: 'test-bucket' }),
    );
  });

  it('puts an object into the configured bucket', async () => {
    mockSend.mockResolvedValueOnce({}); // head bucket (ensureBucket)
    mockSend.mockResolvedValueOnce({}); // put cors (ensureBucket)
    mockSend.mockResolvedValueOnce({}); // put object

    const buffer = Buffer.from('backup-content');
    await service.putObject('backups/postgres/test.dump', buffer, 'application/octet-stream');

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'test-bucket',
        Key: 'backups/postgres/test.dump',
        Body: buffer,
        ContentType: 'application/octet-stream',
      }),
    );
  });

  it('lists objects matching a prefix', async () => {
    const now = new Date();
    mockSend.mockResolvedValueOnce({
      Contents: [
        { Key: 'backups/postgres/b1.dump', Size: 1024, LastModified: now },
        { Key: 'backups/postgres/b2.dump', Size: 2048, LastModified: now },
      ],
    });

    const items = await service.listObjects('backups/postgres/');

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      key: 'backups/postgres/b1.dump',
      size: 1024,
      lastModified: now,
    });
  });

  it('downloads an object as a Buffer', async () => {
    const stream = Readable.from([Buffer.from('hello '), Buffer.from('world')]);
    mockSend.mockResolvedValueOnce({ Body: stream });

    const buffer = await service.getObjectBuffer('test-key');

    expect(buffer.toString('utf-8')).toBe('hello world');
  });
});
