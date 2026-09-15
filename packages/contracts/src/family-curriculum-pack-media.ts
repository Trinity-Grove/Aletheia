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
