import { Injectable } from '@nestjs/common';
import { DevotionalRepository } from '../infrastructure/devotional.repository.js';
import { YouVersionService } from '../infrastructure/youversion.service.js';
import type {
  BiblePassageDto,
  BibleVersionDto,
  DailyDevotionalResponseDto,
  UpsertDailyDevotionalDto,
} from '@aletheia/contracts';

@Injectable()
export class DevotionalService {
  constructor(
    private readonly devotionalRepository: DevotionalRepository,
    private readonly youVersionService: YouVersionService,
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
}
