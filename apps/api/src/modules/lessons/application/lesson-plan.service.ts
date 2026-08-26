import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonPlanFilter, LessonPlanRepository } from '../infrastructure/lesson-plan.repository.js';
import type {
  CompleteLessonDto,
  CreateLessonPlanDto,
  LessonPlanResponseDto,
  RescheduleLessonDto,
  UpdateLessonPlanDto,
} from '@aletheia/contracts';

import type { LessonPlanPublicApi } from './public-api.js';

@Injectable()
export class LessonPlanService implements LessonPlanPublicApi {
  constructor(private readonly lessonPlanRepo: LessonPlanRepository) {}

  async createLessonPlan(familyId: string, dto: CreateLessonPlanDto): Promise<LessonPlanResponseDto> {
    const lesson = await this.lessonPlanRepo.create(familyId, dto);
    return lesson.toResponseDto();
  }

  async getLessonPlan(familyId: string, id: string): Promise<LessonPlanResponseDto> {
    const lesson = await this.lessonPlanRepo.findById(familyId, id);
    if (!lesson) {
      throw new NotFoundException('Lesson plan not found');
    }
    return lesson.toResponseDto();
  }

  async listLessonPlans(familyId: string, filter: LessonPlanFilter = {}): Promise<LessonPlanResponseDto[]> {
    const lessons = await this.lessonPlanRepo.list(familyId, filter);
    return lessons.map((l) => l.toResponseDto());
  }

  async updateLessonPlan(
    familyId: string,
    id: string,
    dto: UpdateLessonPlanDto,
  ): Promise<LessonPlanResponseDto> {
    const updated = await this.lessonPlanRepo.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException('Lesson plan not found');
    }
    return updated.toResponseDto();
  }

  async completeLesson(
    familyId: string,
    id: string,
    dto: CompleteLessonDto,
    learnerId?: string,
  ): Promise<LessonPlanResponseDto> {
    const completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date();
    const updated = await this.lessonPlanRepo.completeLesson(familyId, id, {
      completedAt,
      actualDurationMinutes: dto.actualDurationMinutes ?? null,
      notes: dto.notes ?? null,
      learnerNotes: dto.learnerNotes,
      learnerId,
    });

    if (!updated) {
      throw new NotFoundException('Lesson plan not found');
    }
    return updated.toResponseDto();
  }

  async rescheduleLesson(
    familyId: string,
    id: string,
    dto: RescheduleLessonDto,
  ): Promise<LessonPlanResponseDto> {
    const updated = await this.lessonPlanRepo.reschedule(familyId, id, {
      newDate: dto.newDate,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
      reason: dto.reason ?? null,
    });

    if (!updated) {
      throw new NotFoundException('Lesson plan not found');
    }
    return updated.toResponseDto();
  }

  async deleteLessonPlan(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.lessonPlanRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Lesson plan not found');
    }
    return true;
  }
}
