import { z } from 'zod';

export const learningPathExplorerQuerySchema = z.object({
  learnerId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});

export type LearningPathExplorerQueryDto = z.infer<typeof learningPathExplorerQuerySchema>;

export const learningPathExplorerCompetencySchema = z.object({
  code: z.string(),
  title: z.string(),
  level: z.number().int().nullable(),
  metadata: z.record(z.string(), z.unknown()),
});

export const learningPathExplorerCatalogEntrySchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  version: z.number().int(),
  name: z.string(),
  description: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
  competencies: z.array(learningPathExplorerCompetencySchema),
  selected: z.boolean(),
});

export type LearningPathExplorerCatalogEntryDto = z.infer<typeof learningPathExplorerCatalogEntrySchema>;
