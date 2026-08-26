import type {
  CreateNotificationDto,
  FamilyDataExportPackageDto,
  FamilySettingsResponseDto,
  NotificationItemResponseDto,
} from '@aletheia/contracts';

export const SETTINGS_PUBLIC_API = Symbol('SETTINGS_PUBLIC_API');
export const FAMILY_SETTINGS_PUBLIC_API = SETTINGS_PUBLIC_API;

export interface SettingsPublicApi {
  getSettings(familyId: string): Promise<FamilySettingsResponseDto>;
  createNotification(
    familyId: string,
    dto: CreateNotificationDto,
  ): Promise<NotificationItemResponseDto>;
  exportFamilyData(familyId: string): Promise<FamilyDataExportPackageDto>;
}
