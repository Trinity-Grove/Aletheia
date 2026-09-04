import { createHash, randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ENVIRONMENT, type Environment } from '../config/environment.js';

const UPLOAD_URL_TTL_SECONDS = 5 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

export interface StorageObjectMetadata {
  contentType: string | undefined;
  contentLength: number | undefined;
}

// Sanitizes a client-supplied filename into a safe key segment: strips path
// separators and any character outside a small safe set, so a malicious
// name (`../../etc/passwd`, embedded control characters, etc.) can never
// influence the storage key path. The random UUID prefix on the caller side
// is what actually makes the key unguessable — this just keeps the
// human-readable suffix inert.
function sanitizeFileNameSegment(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
  return cleaned.length > 0 ? cleaned : 'file';
}

/**
 * Thin wrapper around the S3-compatible object storage (MinIO in
 * development/CI, any S3-compatible provider in production) used for
 * portfolio evidence files. Every method operates on a `storageKey`, never
 * a raw filename — callers never construct keys themselves.
 */
@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private bucketEnsured = false;

  constructor(@Inject(ENVIRONMENT) environment: Environment) {
    if (!environment.objectStorage) {
      // Unlike mail (which has a legitimate console-log fallback), there is
      // no sensible no-op for file storage — fail fast at startup instead
      // of failing confusingly on the first upload request.
      throw new Error(
        'ObjectStorageService requires S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET to be configured.',
      );
    }

    this.bucket = environment.objectStorage.bucket;
    this.client = new S3Client({
      endpoint: environment.objectStorage.endpoint,
      forcePathStyle: true,
      region: 'us-east-1',
      credentials: {
        accessKeyId: environment.objectStorage.accessKey,
        secretAccessKey: environment.objectStorage.secretKey,
      },
    });
  }

  // Deliberately NOT run at module init: the app boots (and every unrelated
  // test suite instantiates this service transitively through RecordsModule)
  // in environments with no reachable object storage at all — an eager
  // network call here would hang or fail app bootstrap everywhere, not just
  // upload requests. Ensured lazily, once, right before the one operation
  // that actually needs the bucket to exist.
  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) return;

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Created object storage bucket "${this.bucket}".`);
      } catch {
        // Already exists (race, swallows BucketAlreadyOwnedByYou) or the
        // check above was a transient failure — the presigned PUT below
        // will surface a real error if the bucket genuinely isn't usable.
      }
    }

    this.bucketEnsured = true;
  }

  buildStorageKey(familyId: string, portfolioItemId: string, fileName: string): string {
    const safeName = sanitizeFileNameSegment(fileName);
    return `families/${familyId}/portfolio/${portfolioItemId}/${randomUUID()}-${safeName}`;
  }

  async getPresignedUploadUrl(storageKey: string, contentType: string): Promise<{ uploadUrl: string; expiresAt: Date }> {
    await this.ensureBucket();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
    return { uploadUrl, expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000) };
  }

  async getPresignedDownloadUrl(storageKey: string): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: storageKey });
    const downloadUrl = await getSignedUrl(this.client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
    return { downloadUrl, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000) };
  }

  /**
   * Confirms an object actually exists in storage and reports its real
   * content-type/size — never trust client-reported metadata alone.
   * Returns null if the object doesn't exist (upload never completed).
   */
  async headObject(storageKey: string): Promise<StorageObjectMetadata | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: storageKey }));
      return { contentType: result.ContentType, contentLength: result.ContentLength };
    } catch {
      return null;
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: storageKey }));
  }

  /**
   * Streams the object's actual bytes through SHA-256 — the checksum
   * confirmUpload persists is computed from real content, never from
   * client-reported metadata.
   */
  async computeChecksumSha256(storageKey: string): Promise<string> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }));
    const body = result.Body as Readable;
    const hash = createHash('sha256');

    for await (const chunk of body) {
      hash.update(chunk as Buffer);
    }

    return hash.digest('hex');
  }
}
