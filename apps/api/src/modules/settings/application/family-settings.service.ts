import { Injectable } from '@nestjs/common';
import type {
  FamilySettingsResponseDto,
  UpdateFamilySettingsDto,
} from '@aletheia/contracts';
import { FamilySettingsRepository } from '../infrastructure/family-settings.repository.js';

@Injectable()
export class FamilySettingsService {
  constructor(private readonly settingsRepository: FamilySettingsRepository) {}

  async getSettings(familyId: string): Promise<FamilySettingsResponseDto> {
    const settings = await this.settingsRepository.getOrCreateDefault(familyId);
    return settings.toResponseDto();
  }

  async updateSettings(
    familyId: string,
    dto: UpdateFamilySettingsDto,
  ): Promise<FamilySettingsResponseDto> {
    const updated = await this.settingsRepository.upsert(familyId, dto);
    return updated.toResponseDto();
  }
}
