import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  DailyAgendaItemDto,
  DashboardActivityDto,
  DashboardQueryDto,
  DashboardResponseDto,
  LearnerSummaryDto,
} from '@aletheia/contracts';
import {
  FAMILY_PUBLIC_API,
  type FamilyPublicApi,
} from '../../families/application/public-api.js';
import {
  LEARNERS_PUBLIC_API,
  type LearnersPublicApi,
} from '../../learners/application/public-api.js';
import {
  SCHEDULE_PUBLIC_API,
  type SchedulePublicApi,
} from '../../lessons/application/public-api.js';

function minutesBetween(start?: string | null, end?: string | null): number {
  if (!start || !end) return 0;

  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  if (
    startHour === undefined ||
    startMinute === undefined ||
    endHour === undefined ||
    endMinute === undefined ||
    !Number.isFinite(startHour) ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(endHour) ||
    !Number.isFinite(endMinute)
  ) {
    return 0;
  }

  return Math.max(0, endHour * 60 + endMinute - startHour * 60 - startMinute);
}

function learnerDisplayName(learner: LearnerSummaryDto): string {
  if (learner.preferredName) return learner.preferredName;
  return learner.lastName ? `${learner.firstName} ${learner.lastName}` : learner.firstName;
}

function mapActivity(item: DailyAgendaItemDto): DashboardActivityDto {
  const activity: DashboardActivityDto = {
    id: item.id,
    title: item.title,
    durationMinutes: minutesBetween(item.startTime, item.endTime),
    completed: item.isCompleted,
    type: item.type === 'LESSON' ? 'lesson' : 'routine',
  };

  if (item.subjectName) activity.subjectName = item.subjectName;
  if (item.startTime) activity.scheduledTime = item.startTime;

  return activity;
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(FAMILY_PUBLIC_API)
    private readonly familyApi: FamilyPublicApi,
    @Inject(LEARNERS_PUBLIC_API)
    private readonly learnersApi: LearnersPublicApi,
    @Inject(SCHEDULE_PUBLIC_API)
    private readonly scheduleApi: SchedulePublicApi,
  ) {}

  async getDashboard(
    userId: string,
    familyId: string,
    query: DashboardQueryDto,
  ): Promise<DashboardResponseDto> {
    const family = await this.familyApi.getFamilyForUser(userId, familyId);
    if (!family) {
      throw new NotFoundException('Family not found');
    }

    if (query.learnerId) {
      const learner = await this.learnersApi.findLearnerById(familyId, query.learnerId);
      if (!learner) {
        throw new NotFoundException('Learner not found');
      }
    }

    const [learners, agenda] = await Promise.all([
      this.learnersApi.listActiveLearners(familyId),
      this.scheduleApi.getDailyAgenda(familyId, query.date, query.learnerId),
    ]);
    const lessonItems = agenda.items.filter((item) => item.type === 'LESSON');

    return {
      date: query.date,
      family: { id: family.id, name: family.name },
      learners: learners.map((learner) => ({
        id: learner.id,
        displayName: learnerDisplayName(learner),
      })),
      activeLearnerId: query.learnerId ?? null,
      journey: {
        completedMinutes: agenda.items.reduce(
          (total, item) =>
            item.isCompleted ? total + minutesBetween(item.startTime, item.endTime) : total,
          0,
        ),
        targetMinutes: 0,
        completedLessons: lessonItems.filter((item) => item.isCompleted).length,
        totalLessons: lessonItems.length,
        daySequence: 0,
      },
      activities: agenda.items.map(mapActivity),
    };
  }
}
