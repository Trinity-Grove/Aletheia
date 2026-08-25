import type { PedagogicalFramework } from '@aletheia/contracts';

export class LearnerCurriculumPlanEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly learnerId: string,
    public readonly academicYearId: string,
    public readonly pedagogicalFramework: PedagogicalFramework,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
