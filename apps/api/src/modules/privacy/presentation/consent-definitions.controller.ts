import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createConsentDefinitionSchema,
  updateConsentDefinitionStatusSchema,
  type CreateConsentDefinitionInput,
  type ConsentDefinitionResponseDto,
  type UpdateConsentDefinitionStatusDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { ConsentDefinitionsService } from '../application/consent-definitions.service.js';

@ApiTags('Consent Definitions (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/consent-definitions', version: '1' })
export class ConsentDefinitionsController {
  constructor(private readonly service: ConsentDefinitionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a consent definition' })
  async create(
    @Body(new ZodValidationPipe(createConsentDefinitionSchema)) dto: CreateConsentDefinitionInput,
  ): Promise<ConsentDefinitionResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List consent definitions, optionally filtered by code' })
  async list(@Query('code') code?: string): Promise<ConsentDefinitionResponseDto[]> {
    if (code) {
      return this.service.findByCode(code);
    }
    return this.service.list();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a consent definition by ID' })
  async findById(@Param('id') id: string): Promise<ConsentDefinitionResponseDto> {
    return this.service.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition a consent definition status (DRAFT -> PUBLISHED -> DEPRECATED -> ARCHIVED)' })
  async transitionStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateConsentDefinitionStatusSchema)) dto: UpdateConsentDefinitionStatusDto,
  ): Promise<ConsentDefinitionResponseDto> {
    return this.service.transitionStatus(id, dto.status);
  }
}
