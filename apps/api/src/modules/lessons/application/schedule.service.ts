import { Injectable, NotFoundException } from '@nestjs/common';
import { ScheduleRepository, ScheduleSlotFilter } from '../infrastructure/schedule.repository.js';
import { LessonPlanRepository } from '../infrastructure/lesson-plan.repository.js';
import type {
  CreateScheduleSlotDto,
  DailyAgendaDto,
  DailyAgendaItemDto,
  DayOfWeek,
  ScheduleSlotResponseDto,
  UpdateScheduleSlotDto,
} from '@aletheia/contracts';

@Injectable()
export class ScheduleService {
  constructor(
    private readonly scheduleRepo: ScheduleRepository,
    private readonly lessonPlanRepo: LessonPlanRepository,
  ) {}

  async createSlot(familyId: string, dto: CreateScheduleSlotDto): Promise<ScheduleSlotResponseDto> {
    const slot = await this.scheduleRepo.create(familyId, dto);
    return slot.toResponseDto();
  }

  async getSlot(familyId: string, id: string): Promise<ScheduleSlotResponseDto> {
    const slot = await this.scheduleRepo.findById(familyId, id);
    if (!slot) {
      throw new NotFoundException('Schedule slot not found');
    }
    return slot.toResponseDto();
  }

  async listSlots(familyId: string, filter: ScheduleSlotFilter = {}): Promise<ScheduleSlotResponseDto[]> {
    const slots = await this.scheduleRepo.list(familyId, filter);
    return slots.map((s) => s.toResponseDto());
  }

  async updateSlot(
    familyId: string,
    id: string,
    dto: UpdateScheduleSlotDto,
  ): Promise<ScheduleSlotResponseDto> {
    const updated = await this.scheduleRepo.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException('Schedule slot not found');
    }
    return updated.toResponseDto();
  }

  async deleteSlot(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.scheduleRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Schedule slot not found');
    }
    return true;
  }

  async getDailyAgenda(familyId: string, dateStr: string, learnerId?: string): Promise<DailyAgendaDto> {
    // Parse date (YYYY-MM-DD)
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const day = Number(dayStr);

    const date = new Date(Date.UTC(year, month, day));
    const jsDay = date.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    // Convert to DayOfWeek (Monday=1, Tuesday=2, ..., Sunday=7)
    const dayOfWeek = (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

    // 1. Fetch weekly routine slots for this day of week
    const routineSlots = await this.scheduleRepo.list(familyId, {
      dayOfWeek,
      learnerId,
    });

    // 2. Fetch lesson plans for this date
    const lessonPlans = await this.lessonPlanRepo.list(familyId, {
      date: dateStr,
      learnerId,
    });

    // 3. Convert routine slots to agenda items
    const slotItems: DailyAgendaItemDto[] = routineSlots.map((slot) => {
      const slotDto = slot.toResponseDto();
      const item: DailyAgendaItemDto = {
        type: 'ROUTINE_SLOT',
        id: slot.id,
        title: slot.title,
        isCompleted: false,
        learnerIds: slot.learnerId ? [slot.learnerId] : [],
        scheduleSlot: slotDto,
      };

      if (slot.startTime !== undefined) {
        item.startTime = slot.startTime;
      }
      if (slot.endTime !== undefined) {
        item.endTime = slot.endTime;
      }
      if (slot.subjectId !== undefined && slot.subjectId !== null) {
        item.subjectId = slot.subjectId;
      }
      if (slot.subjectName !== undefined && slot.subjectName !== null) {
        item.subjectName = slot.subjectName;
      }
      if (slot.color !== undefined && slot.color !== null) {
        item.subjectColor = slot.color;
      }

      return item;
    });

    // 4. Convert lesson plans to agenda items
    const lessonItems: DailyAgendaItemDto[] = lessonPlans.map((lesson) => {
      const lessonDto = lesson.toResponseDto();
      const isCompleted = learnerId
        ? (lesson.learners.find((l) => l.learnerId === learnerId)?.completed ?? lesson.status === 'COMPLETED')
        : lesson.status === 'COMPLETED';

      const item: DailyAgendaItemDto = {
        type: 'LESSON',
        id: lesson.id,
        title: lesson.title,
        status: lesson.status,
        learnerIds: lesson.learners.map((l) => l.learnerId),
        isCompleted,
        lessonPlan: lessonDto,
      };

      if (lesson.startTime !== null && lesson.startTime !== undefined) {
        item.startTime = lesson.startTime;
      }
      if (lesson.endTime !== null && lesson.endTime !== undefined) {
        item.endTime = lesson.endTime;
      }
      if (lesson.subjectId !== undefined) {
        item.subjectId = lesson.subjectId;
      }
      if (lesson.subjectName !== undefined) {
        item.subjectName = lesson.subjectName;
      }
      if (lesson.subjectColor !== null && lesson.subjectColor !== undefined) {
        item.subjectColor = lesson.subjectColor;
      }

      return item;
    });

    // 5. Combine and sort items chronologically by startTime, then title
    const allItems = [...slotItems, ...lessonItems].sort((a, b) => {
      const timeA = a.startTime ?? '99:99';
      const timeB = b.startTime ?? '99:99';
      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }
      return a.title.localeCompare(b.title);
    });

    return {
      date: dateStr,
      dayOfWeek,
      items: allItems,
    };
  }
}
