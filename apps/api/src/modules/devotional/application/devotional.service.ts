import { Injectable } from '@nestjs/common';
import { DevotionalRepository } from '../infrastructure/devotional.repository.js';
import { PrayerRepository } from '../infrastructure/prayer.repository.js';
import { YouVersionService } from '../infrastructure/youversion.service.js';
import type { DevotionalPublicApi } from './public-api.js';
import type {
  BiblePassageDto,
  BibleVersionDto,
  DailyDevotionalResponseDto,
  UpsertDailyDevotionalDto,
} from '@aletheia/contracts';

@Injectable()
export class DevotionalService implements DevotionalPublicApi {
  constructor(
    private readonly devotionalRepository: DevotionalRepository,
    private readonly youVersionService: YouVersionService,
    private readonly prayerRepository: PrayerRepository,
  ) {}

  async upsertDevotional(
    familyId: string,
    dto: UpsertDailyDevotionalDto,
  ): Promise<DailyDevotionalResponseDto> {
    const devotional = await this.devotionalRepository.upsert(familyId, dto);
    return devotional.toResponseDto();
  }

  async getDevotionalByDate(
    familyId: string,
    date: string,
  ): Promise<DailyDevotionalResponseDto | null> {
    const dateObj = new Date(date);
    const devotional = await this.devotionalRepository.findByDate(familyId, dateObj);
    return devotional ? devotional.toResponseDto() : null;
  }

  async getRecentDevotionals(
    familyId: string,
    limit = 30,
  ): Promise<DailyDevotionalResponseDto[]> {
    const devotionals = await this.devotionalRepository.findRecent(familyId, limit);
    return devotionals.map((d) => d.toResponseDto());
  }

  async lookupScripture(
    reference: string,
    versionId?: string,
  ): Promise<BiblePassageDto | null> {
    return this.youVersionService.fetchPassage(reference, versionId);
  }

  async getAvailableBibles(): Promise<BibleVersionDto[]> {
    return this.youVersionService.getAvailableBibles();
  }

  async getTodayDevotionalSummary(
    familyId: string,
  ): Promise<{ hasDevotional: boolean; bibleReference?: string; memoryVerse?: string }> {
    const today = new Date();
    const devotional = await this.devotionalRepository.findByDate(familyId, today);
    if (!devotional) {
      return { hasDevotional: false };
    }
    return {
      hasDevotional: true,
      bibleReference: devotional.bibleReference,
      ...(devotional.memoryVerse ? { memoryVerse: devotional.memoryVerse } : {}),
    };
  }

  async getActivePrayerCount(familyId: string): Promise<number> {
    const prayers = await this.prayerRepository.findByFamilyId(familyId, {
      isAnswered: false,
      includeArchived: false,
    });
    return prayers.length;
  }
}
