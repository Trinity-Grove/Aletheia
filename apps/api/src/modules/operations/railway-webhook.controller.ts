import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RailwayWebhookPayloadSchema } from '@aletheia/contracts';
import { RailwayWebhookGuard } from './railway-webhook.guard.js';
import { OperationsService } from './operations.service.js';

@ApiTags('Operations Webhooks')
@Controller({ path: 'webhooks/railway', version: '1' })
@UseGuards(RailwayWebhookGuard)
export class RailwayWebhookController {
  constructor(private readonly operationsService: OperationsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive and process Railway platform webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(@Body() rawBody: unknown): Promise<{ received: boolean; alertId: string }> {
    const payload = RailwayWebhookPayloadSchema.parse(rawBody);
    return this.operationsService.handleRailwayWebhook(payload);
  }
}
