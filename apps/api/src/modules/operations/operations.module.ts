import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module.js';
import { HealthModule } from '../../health/health.module.js';
import { OperationsController } from './operations.controller.js';
import { RailwayWebhookController } from './railway-webhook.controller.js';
import { OperationsService } from './operations.service.js';
import { RailwayWebhookGuard } from './railway-webhook.guard.js';

@Module({
  imports: [DatabaseModule, HealthModule],
  controllers: [OperationsController, RailwayWebhookController],
  providers: [OperationsService, RailwayWebhookGuard],
  exports: [OperationsService],
})
export class OperationsModule {}
