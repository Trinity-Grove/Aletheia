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
import {
  CURRICULUM_PUBLIC_API,
  type CurriculumPublicApi,
} from '../../curriculum/application/public-api.js';

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

// The Nth day of the current academic year, 1-indexed by calendar days
// from its start date (inclusive). Returns 0 -- the documented "unknown"
// value per the dashboard spec -- when there is no current academic year,
// it has no start date, or the requested date falls outside its window;
// the UI hides the counter rather than showing a misleading number.
function computeDaySequence(
  targetDate: string,
  window: { startDate: Date; endDate: Date | null } | null,
): number {
  if (!window) return 0;

  const target = new Date(`${targetDate}T00:00:00.000Z`);
  const start = new Date(
    Date.UTC(window.startDate.getUTCFullYear(), window.startDate.getUTCMonth(), window.startDate.getUTCDate()),
  );
  if (Number.isNaN(target.getTime())) return 0;
  if (window.endDate) {
    const end = new Date(
      Date.UTC(window.endDate.getUTCFullYear(), window.endDate.getUTCMonth(), window.endDate.getUTCDate()),
    );
    if (target.getTime() > end.getTime()) return 0;
  }
  const diffDays = Math.round((target.getTime() - start.getTime()) / 86_400_000);
  return diffDays >= 0 ? diffDays + 1 : 0;
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
    @Inject(CURRICULUM_PUBLIC_API)
    private readonly curriculumApi: CurriculumPublicApi,
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

    const [learners, agenda, academicYearWindow] = await Promise.all([
      this.learnersApi.listActiveLearners(familyId),
      this.scheduleApi.getDailyAgenda(familyId, query.date, query.learnerId),
      this.curriculumApi.getCurrentAcademicYearWindow(familyId),
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
        // The day's full planned instruction time — every scheduled item,
        // completed or not — so "X min of Y min" and the progress bar
        // reflect the actual target instead of always reading 0/0%.
        targetMinutes: agenda.items.reduce(
          (total, item) => total + minutesBetween(item.startTime, item.endTime),
          0,
        ),
        completedLessons: lessonItems.filter((item) => item.isCompleted).length,
        totalLessons: lessonItems.length,
        daySequence: computeDaySequence(query.date, academicYearWindow),
      },
      activities: agenda.items.map(mapActivity),
    };
  }
}
