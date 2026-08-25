import { Injectable, NotFoundException } from '@nestjs/common';
import { ObjectiveFilter, ObjectiveRepository } from '../infrastructure/objective.repository.js';
import type {
  CreateObjectiveDto,
  ObjectiveResponseDto,
  UpdateObjectiveDto,
} from '@aletheia/contracts';

@Injectable()
export class ObjectiveService {
  constructor(private readonly objectiveRepo: ObjectiveRepository) {}

  async createObjective(familyId: string, dto: CreateObjectiveDto): Promise<ObjectiveResponseDto> {
    const objective = await this.objectiveRepo.create(familyId, dto);
    return this.serializeObjective(objective);
  }

  async updateObjective(familyId: string, id: string, dto: UpdateObjectiveDto): Promise<ObjectiveResponseDto> {
    const objective = await this.objectiveRepo.update(familyId, id, dto);
    if (!objective) {
      throw new NotFoundException('Learning objective not found');
    }
    return this.serializeObjective(objective);
  }

  async listObjectives(familyId: string, filter: ObjectiveFilter = {}): Promise<ObjectiveResponseDto[]> {
    const list = await this.objectiveRepo.list(familyId, filter);
    return list.map((o) => this.serializeObjective(o));
  }

  async deleteObjective(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.objectiveRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Learning objective not found');
    }
    return true;
  }

  private serializeObjective(o: any): ObjectiveResponseDto {
    return {
      id: o.id,
      familyId: o.familyId,
      learnerId: o.learnerId,
      subjectId: o.subjectId,
      academicYearId: o.academicYearId,
      title: o.title,
      description: o.description,
      status: o.status,
      targetDate: o.targetDate ? o.targetDate.toISOString().split('T')[0] : undefined,
      achievedAt: o.achievedAt ? o.achievedAt.toISOString() : undefined,
      order: o.order,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    };
  }
}
