import { z } from 'zod';

const secureUrlSchema = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:', 'Media URLs must use HTTPS.');

const commonMediaFields = {
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
};

export const addFamilyCurriculumPackMediaSchema = z.discriminatedUnion('sourceType', [
  z.object({
    ...commonMediaFields,
    sourceType: z.literal('EXTERNAL_URL'),
    url: secureUrlSchema,
  }),
  z.object({
    ...commonMediaFields,
    sourceType: z.literal('UPLOAD'),
    storageKey: z
      .string()
      .trim()
      .min(1)
      .max(512)
      .regex(/^[A-Za-z0-9][A-Za-z0-9/_\-.]*$/, 'Storage key contains invalid characters.'),
    url: secureUrlSchema.optional(),
    mimeType: z.string().trim().min(1).max(160).optional(),
    sizeBytes: z.number().int().positive().max(1_000_000_000).optional(),
  }),
]);

export type AddFamilyCurriculumPackMediaDto = z.infer<
  typeof addFamilyCurriculumPackMediaSchema
>;

export const ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
] as const;

export const FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const requestFamilyCurriculumPackMediaUploadSchema = z.object({
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_FAMILY_CURRICULUM_PACK_MEDIA_MIME_TYPES),
  fileSizeBytes: z.number().int().positive().max(FAMILY_CURRICULUM_PACK_MEDIA_MAX_FILE_SIZE_BYTES),
});

export type RequestFamilyCurriculumPackMediaUploadDto = z.infer<
  typeof requestFamilyCurriculumPackMediaUploadSchema
>;

export const familyCurriculumPackMediaUploadUrlResponseSchema = z.object({
  mediaId: z.string().uuid(),
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  expiresAt: z.string(),
});

export type FamilyCurriculumPackMediaUploadUrlResponseDto = z.infer<
  typeof familyCurriculumPackMediaUploadUrlResponseSchema
>;

export const familyCurriculumPackMediaResponseSchema = z.object({
  id: z.string().uuid(),
  familyCurriculumPackId: z.string().uuid(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  sourceType: z.enum(['UPLOAD', 'EXTERNAL_URL']),
  provider: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  storageKey: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FamilyCurriculumPackMediaResponseDto = z.infer<
  typeof familyCurriculumPackMediaResponseSchema
>;
