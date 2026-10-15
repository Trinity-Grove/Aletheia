import { z } from 'zod';

export const curriculumPackMediaTypeSchema = z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']);
export type CurriculumPackMediaType = z.infer<typeof curriculumPackMediaTypeSchema>;

export const curriculumPackMediaSourceTypeSchema = z.enum(['UPLOAD', 'EXTERNAL_URL']);
export type CurriculumPackMediaSourceType = z.infer<typeof curriculumPackMediaSourceTypeSchema>;

export const curriculumPackMediaResponseSchema = z
  .object({
    id: z.string().uuid(),
    curriculumPackId: z.string().uuid(),
    mediaType: curriculumPackMediaTypeSchema,
    sourceType: curriculumPackMediaSourceTypeSchema,
    provider: z.string().nullable(),
    title: z.string(),
    description: z.string().nullable(),
    url: z.string().url().nullable(),
    mimeType: z.string().nullable(),
    sizeBytes: z.number().int().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type CurriculumPackMediaResponseDto = z.infer<typeof curriculumPackMediaResponseSchema>;
