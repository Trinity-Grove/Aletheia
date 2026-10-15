import type { DashboardResponseDto } from '@aletheia/contracts';

type TourAvailabilityData = {
  onboarding?: Pick<NonNullable<DashboardResponseDto['onboarding']>, 'dismissed'> | undefined;
};

export function shouldShowTourTrigger(
  data: TourAvailabilityData | null,
  tourCompleted: boolean,
): boolean {
  return data !== null && data.onboarding?.dismissed !== true && !tourCompleted;
}
