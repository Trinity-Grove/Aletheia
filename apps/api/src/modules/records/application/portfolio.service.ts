import { Injectable, NotFoundException } from '@nestjs/common';
import { PortfolioRepository } from '../infrastructure/portfolio.repository.js';
import type {
  CreatePortfolioItemDto,
  PortfolioItemFilterDto,
  PortfolioItemResponseDto,
  UpdatePortfolioItemDto,
} from '@aletheia/contracts';

@Injectable()
export class PortfolioService {
  constructor(private readonly portfolioRepo: PortfolioRepository) {}

  async createItem(familyId: string, dto: CreatePortfolioItemDto): Promise<PortfolioItemResponseDto> {
    const item = await this.portfolioRepo.create(familyId, dto);
    return item.toResponseDto();
  }

  async getItem(familyId: string, id: string): Promise<PortfolioItemResponseDto> {
    const item = await this.portfolioRepo.findById(familyId, id);
    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }
    return item.toResponseDto();
  }

  async listItems(
    familyId: string,
    filter: PortfolioItemFilterDto = {},
  ): Promise<PortfolioItemResponseDto[]> {
    const items = await this.portfolioRepo.list(familyId, filter);
    return items.map((i) => i.toResponseDto());
  }

  async updateItem(
    familyId: string,
    id: string,
    dto: UpdatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    const updated = await this.portfolioRepo.update(familyId, id, dto);
    if (!updated) {
      throw new NotFoundException('Portfolio item not found');
    }
    return updated.toResponseDto();
  }

  async deleteItem(familyId: string, id: string): Promise<boolean> {
    const deleted = await this.portfolioRepo.delete(familyId, id);
    if (!deleted) {
      throw new NotFoundException('Portfolio item not found');
    }
    return true;
  }
}
