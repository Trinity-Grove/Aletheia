export class AcademicYearEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly year: number,
    public readonly title: string,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly isCurrent: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
