import { createHash, randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
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
 *
 * Object storage is optional infrastructure like Redis and mail — this
 * codebase's established invariant (see environment.spec.ts's "does not
 * require optional infrastructure for API startup") is that the app must
 * always be constructible without it. So this service never touches the
 * network, or even validates config, until one of its methods is actually
 * called — construction itself can never fail or block bootstrap.
 */
@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private client: S3Client | undefined;
  private bucket: string | undefined;
  private bucketEnsured = false;

  constructor(@Inject(ENVIRONMENT) private readonly environment: Environment) {}

  private getClient(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      if (!this.environment.objectStorage) {
        throw new Error(
          'Object storage is not configured (S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY/S3_BUCKET).',
        );
      }
      this.bucket = this.environment.objectStorage.bucket;
      this.client = new S3Client({
        endpoint: this.environment.objectStorage.endpoint,
        forcePathStyle: true,
        region: 'us-east-1',
        credentials: {
          accessKeyId: this.environment.objectStorage.accessKey,
          secretAccessKey: this.environment.objectStorage.secretKey,
        },
      });
    }
    return { client: this.client, bucket: this.bucket };
  }

  // Deliberately NOT run at construction or module init: ensured lazily,
  // once, right before the one operation that actually needs the bucket to
  // exist, so an environment with no reachable object storage never pays
  // for (or fails on) a network call it never asked for.
  private async ensureBucket(): Promise<void> {
    if (this.bucketEnsured) return;
    const { client, bucket } = this.getClient();

    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      try {
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
        this.logger.log(`Created object storage bucket "${bucket}".`);
      } catch {
        // Already exists (race, swallows BucketAlreadyOwnedByYou) or the
        // check above was a transient failure — the presigned PUT below
        // will surface a real error if the bucket genuinely isn't usable.
      }
    }

    // A presigned upload/download URL is consumed directly by the browser
    // (see portfolio-item-modal.tsx's real file upload), not by this server
    // — without a CORS rule allowing the web origin, that PUT/GET fails the
    // browser's preflight before it ever reaches the object storage.
    try {
      await client.send(
        new PutBucketCorsCommand({
          Bucket: bucket,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: [this.environment.webOrigin],
                AllowedMethods: ['GET', 'PUT', 'HEAD'],
                AllowedHeaders: ['*'],
                ExposeHeaders: ['ETag'],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        }),
      );
    } catch (err) {
      this.logger.warn(
        `Could not configure CORS on bucket "${bucket}" — direct browser uploads may fail: ${(err as Error).message}`,
      );
    }

    this.bucketEnsured = true;
  }

  buildStorageKey(familyId: string, portfolioItemId: string, fileName: string): string {
    const safeName = sanitizeFileNameSegment(fileName);
    return `families/${familyId}/portfolio/${portfolioItemId}/${randomUUID()}-${safeName}`;
  }

  async getPresignedUploadUrl(storageKey: string, contentType: string): Promise<{ uploadUrl: string; expiresAt: Date }> {
    await this.ensureBucket();
    const { client, bucket } = this.getClient();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
    return { uploadUrl, expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000) };
  }

  async getPresignedDownloadUrl(storageKey: string): Promise<{ downloadUrl: string; expiresAt: Date }> {
    const { client, bucket } = this.getClient();
    const command = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
    const downloadUrl = await getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
    return { downloadUrl, expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000) };
  }

  /**
   * Confirms an object actually exists in storage and reports its real
   * content-type/size — never trust client-reported metadata alone.
   * Returns null if the object doesn't exist (upload never completed).
   */
  async headObject(storageKey: string): Promise<StorageObjectMetadata | null> {
    const { client, bucket } = this.getClient();
    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey }));
      return { contentType: result.ContentType, contentLength: result.ContentLength };
    } catch {
      return null;
    }
  }

  async deleteObject(storageKey: string): Promise<void> {
    const { client, bucket } = this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
  }

  /**
   * Streams the object's actual bytes through SHA-256 — the checksum
   * confirmUpload persists is computed from real content, never from
   * client-reported metadata.
   */
  async computeChecksumSha256(storageKey: string): Promise<string> {
    const { client, bucket } = this.getClient();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }));
    const body = result.Body as Readable;
    const hash = createHash('sha256');

    for await (const chunk of body) {
      hash.update(chunk as Buffer);
    }

    return hash.digest('hex');
  }
}
