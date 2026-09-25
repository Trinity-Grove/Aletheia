import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  addDefinitionTagSchema,
  searchDefinitionsByTagSchema,
  type AddDefinitionTagOutput,
  type DefinitionTagResponseDto,
  type SearchDefinitionsByTagDto,
} from '@aletheia/contracts';
import { JwtAuthGuard, PlatformAdminGuard } from '../../../platform/auth/index.js';
import { ZodValidationPipe } from '../../../platform/validation/index.js';
import { DefinitionTagsService } from '../application/definition-tags.service.js';

// Admin surface for generic tagging (issue #96 section 38), same
// PlatformAdminGuard pairing as every other admin/curriculum-definitions/*
// controller -- no new authorization design.
@ApiTags('Curriculum Definitions (Admin) - Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@Controller({ path: 'admin/curriculum-definitions/tags', version: '1' })
export class DefinitionTagsController {
  constructor(private readonly service: DefinitionTagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tag a definition (any packageable Definition/Version row)' })
  async addTag(
    @Body(new ZodValidationPipe(addDefinitionTagSchema)) dto: AddDefinitionTagOutput,
  ): Promise<DefinitionTagResponseDto> {
    return this.service.addTag(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List the tags on one definition' })
  async listForDefinition(
    @Query('entityType') entityType: string,
    @Query('definitionId') definitionId: string,
  ): Promise<DefinitionTagResponseDto[]> {
    return this.service.listTagsForDefinition(entityType, definitionId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Find every definition carrying a given tag (section 37: searchable by tag)' })
  async search(
    @Query(new ZodValidationPipe(searchDefinitionsByTagSchema)) query: SearchDefinitionsByTagDto,
  ): Promise<DefinitionTagResponseDto[]> {
    return this.service.search(query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a tag' })
  async removeTag(@Param('id') id: string): Promise<void> {
    await this.service.removeTag(id);
  }
}
