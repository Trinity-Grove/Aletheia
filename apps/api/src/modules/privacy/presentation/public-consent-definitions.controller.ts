import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ConsentDefinitionResponseDto, ConsentScope } from '@aletheia/contracts';
import { ConsentDefinitionsService } from '../application/consent-definitions.service.js';

@ApiTags('Consent Definitions (Public)')
@Controller({ path: 'consent-definitions', version: '1' })
export class PublicConsentDefinitionsController {
  constructor(private readonly service: ConsentDefinitionsService) {}

  @Get('published')
  @ApiOperation({ summary: 'Get published consent definitions, optionally filtered by scope' })
  async getPublished(@Query('scope') scope?: ConsentScope): Promise<ConsentDefinitionResponseDto[]> {
    return this.service.getPublishedDefinitions(scope);
  }
}
