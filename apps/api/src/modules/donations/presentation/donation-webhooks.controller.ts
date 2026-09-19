import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DonationsService } from '../application/donations.service.js';

@ApiTags('Donations Webhooks')
@Controller({ path: 'donations/webhooks', version: '1' })
export class DonationWebhooksController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming webhook notifications from payment gateways' })
  @ApiResponse({ status: 200, description: 'Webhook processed or acknowledged.' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: unknown,
    @Headers('x-signature') signature?: string,
  ): Promise<{ received: boolean; idempotent?: boolean; handled?: boolean }> {
    return this.donationsService.handleWebhook(provider, payload, signature);
  }
}
