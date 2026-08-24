import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateFamilyDto, FamilyResponseDto } from '@aletheia/contracts';
import { FamilyRepository } from '../infrastructure/family.repository.js';
import type { FamilyPublicApi } from './public-api.js';

@Injectable()
export class FamilyService implements FamilyPublicApi {
  constructor(private readonly familyRepository: FamilyRepository) {}

  async createFamily(userId: string, dto: CreateFamilyDto): Promise<FamilyResponseDto> {
    const family = await this.familyRepository.createWithOwner(
      {
        name: dto.name,
        countryCode: dto.countryCode,
        stateProvince: dto.stateProvince ?? null,
      },
      userId,
    );
    return family.toDto();
  }

  async getMyFamilies(userId: string): Promise<FamilyResponseDto[]> {
    const families = await this.familyRepository.findByUserId(userId);
    return families.map((f) => f.toDto());
  }

  async getFamilyById(userId: string, familyId: string): Promise<FamilyResponseDto> {
    const isMember = await this.familyRepository.isMember(userId, familyId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this family.');
    }

    const family = await this.familyRepository.findById(familyId);
    if (!family) {
      throw new NotFoundException('Family not found.');
    }

    return family.toDto();
  }

  async isGuardianInFamily(userId: string, familyId: string): Promise<boolean> {
    return this.familyRepository.isMember(userId, familyId);
  }

  async getFamilyForUser(userId: string, familyId: string): Promise<FamilyResponseDto | null> {
    const isMember = await this.familyRepository.isMember(userId, familyId);
    if (!isMember) return null;
    const family = await this.familyRepository.findById(familyId);
    return family ? family.toDto() : null;
  }
}
