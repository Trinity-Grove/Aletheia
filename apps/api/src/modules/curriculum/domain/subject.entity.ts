export class SubjectEntity {
  constructor(
    public readonly id: string,
    public readonly familyId: string,
    public readonly name: string,
    public readonly color: string | null,
    public readonly icon: string | null,
    public readonly description: string | null,
    public readonly archivedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
