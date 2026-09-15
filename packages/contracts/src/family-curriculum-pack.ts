import { z } from 'zod';
import { curriculumPackExportDocumentSchema } from './curriculum-pack-export.js';

/** A family's editable copy of a published platform curriculum pack. */
export const installFamilyCurriculumPackSchema = z.object({
  sourcePackId: z.string().uuid(),
});

export type InstallFamilyCurriculumPackDto = z.infer<typeof installFamilyCurriculumPackSchema>;

/**
 * Family edits replace the portable document as a whole. The source pack
 * pointer is kept separately by the API and cannot be changed by this DTO.
 */
export const updateFamilyCurriculumPackSchema = z.object({
  document: curriculumPackExportDocumentSchema,
});

export type UpdateFamilyCurriculumPackDto = z.infer<typeof updateFamilyCurriculumPackSchema>;

export const familyCurriculumPackResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  sourcePackId: z.string().uuid(),
  sourcePackCode: z.string(),
  sourcePackVersion: z.number().int(),
  revision: z.number().int().min(1),
  document: curriculumPackExportDocumentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FamilyCurriculumPackResponseDto = z.infer<typeof familyCurriculumPackResponseSchema>;

export const familyCurriculumPackRevisionResponseSchema = z.object({
  id: z.string().uuid(),
  familyCurriculumPackId: z.string().uuid(),
  revision: z.number().int().min(1),
  document: curriculumPackExportDocumentSchema,
  createdAt: z.string(),
});

export type FamilyCurriculumPackRevisionResponseDto = z.infer<
  typeof familyCurriculumPackRevisionResponseSchema
>;
