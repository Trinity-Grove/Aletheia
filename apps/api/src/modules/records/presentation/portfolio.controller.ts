import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  type CreatePortfolioItemDto,
  type EvidenceType,
  type PortfolioItemFilterDto,
  type PortfolioItemResponseDto,
  type UpdatePortfolioItemDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, FamilyTenantGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { PortfolioService } from '../application/portfolio.service.js';

@ApiTags('Portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, FamilyTenantGuard)
@Controller({ path: 'families/:familyId/portfolio', version: '1' })
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a portfolio evidence item' })
  async createItem(
    @Param('familyId') familyId: string,
    @Body(new ZodValidationPipe(createPortfolioItemSchema)) dto: CreatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolioService.createItem(familyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List portfolio evidence items with optional filters' })
  async getItems(
    @Param('familyId') familyId: string,
    @Query('learnerId') learnerId?: string,
    @Query('learningRecordId') learningRecordId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('type') type?: string,
    @Query('isHighlight') isHighlight?: string,
    @Query('tag') tag?: string,
  ): Promise<PortfolioItemResponseDto[]> {
    const filter: PortfolioItemFilterDto = {
      ...(learnerId ? { learnerId } : {}),
      ...(learningRecordId ? { learningRecordId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(type ? { type: type as EvidenceType } : {}),
      ...(isHighlight !== undefined ? { isHighlight: isHighlight === 'true' } : {}),
      ...(tag ? { tag } : {}),
    };
    return this.portfolioService.listItems(familyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a portfolio item by ID' })
  async getItemById(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolioService.getItem(familyId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a portfolio item' })
  async updateItem(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePortfolioItemSchema)) dto: UpdatePortfolioItemDto,
  ): Promise<PortfolioItemResponseDto> {
    return this.portfolioService.updateItem(familyId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a portfolio item' })
  async deleteItem(
    @Param('familyId') familyId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const success = await this.portfolioService.deleteItem(familyId, id);
    return { success };
  }
}
