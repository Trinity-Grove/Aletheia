import { Injectable, NotFoundException } from '@nestjs/common';
import { PrayerRepository } from '../infrastructure/prayer.repository.js';
import type {
  AnswerPrayerDto,
  CreatePrayerDto,
  PrayerResponseDto,
  UpdatePrayerDto,
} from '@aletheia/contracts';

@Injectable()
export class PrayerService {
  constructor(private readonly prayerRepository: PrayerRepository) {}

  async createPrayer(familyId: string, dto: CreatePrayerDto): Promise<PrayerResponseDto> {
    const prayer = await this.prayerRepository.create(familyId, dto);
    return prayer.toResponseDto();
  }

  async getFamilyPrayers(
    familyId: string,
    filter?: { isAnswered?: boolean; includeArchived?: boolean },
  ): Promise<PrayerResponseDto[]> {
    const prayers = await this.prayerRepository.findByFamilyId(familyId, filter);
    return prayers.map((prayer) => prayer.toResponseDto());
  }

  async getPrayerById(familyId: string, id: string): Promise<PrayerResponseDto> {
    const prayer = await this.prayerRepository.findByIdAndFamilyId(familyId, id);
    if (!prayer) {
      throw new NotFoundException(`Prayer request not found: ${id}`);
    }
    return prayer.toResponseDto();
  }

  async updatePrayer(
    familyId: string,
    id: string,
    dto: UpdatePrayerDto,
  ): Promise<PrayerResponseDto> {
    const updated = await this.prayerRepository.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException(`Prayer request not found: ${id}`);
    }
    return updated.toResponseDto();
  }

  async answerPrayer(
    familyId: string,
    id: string,
    dto: AnswerPrayerDto,
  ): Promise<PrayerResponseDto> {
    const updated = await this.prayerRepository.update(familyId, id, {
      isAnswered: true,
      answeredAt: new Date(),
      answeredNote: dto.answeredNote?.trim() || null,
    });
    if (!updated) {
      throw new NotFoundException(`Prayer request not found: ${id}`);
    }
    return updated.toResponseDto();
  }

  async archivePrayer(familyId: string, id: string): Promise<PrayerResponseDto> {
    const updated = await this.prayerRepository.update(familyId, id, {
      archivedAt: new Date(),
    });
    if (!updated) {
      throw new NotFoundException(`Prayer request not found: ${id}`);
    }
    return updated.toResponseDto();
  }
}
