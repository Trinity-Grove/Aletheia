import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { ZodError } from 'zod';
import { RailwayWebhookGuard } from './railway-webhook.guard.js';
import { RailwayWebhookController } from './railway-webhook.controller.js';
import type { OperationsService } from './operations.service.js';

describe('RailwayWebhookController', () => {
  let controller: RailwayWebhookController;
  let mockOperationsService: jest.Mocked<OperationsService>;

  beforeEach(() => {
    mockOperationsService = {
      handleRailwayWebhook: jest.fn(),
    } as unknown as jest.Mocked<OperationsService>;

    controller = new RailwayWebhookController(mockOperationsService);
  });

  it('has RailwayWebhookGuard applied to the controller class', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, RailwayWebhookController);
    expect(guards).toBeDefined();
    expect(guards).toContain(RailwayWebhookGuard);
  });

  it('validates payload and calls operationsService.handleRailwayWebhook', async () => {
    const payload = {
      type: 'DEPLOY',
      environment: 'production',
      service: { name: 'aletheia-api' },
      deployment: { status: 'SUCCESS' },
    };

    mockOperationsService.handleRailwayWebhook.mockResolvedValue({
      received: true,
      alertId: '123e4567-e89b-12d3-a456-426614174000',
    });

    const result = await controller.handleWebhook(payload);

    expect(mockOperationsService.handleRailwayWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DEPLOY',
        environment: 'production',
      }),
    );
    expect(result).toEqual({
      received: true,
      alertId: '123e4567-e89b-12d3-a456-426614174000',
    });
  });

  it('throws validation error when payload is missing required "type"', async () => {
    const invalidPayload = {
      environment: 'production',
    };

    await expect(controller.handleWebhook(invalidPayload)).rejects.toThrow(ZodError);
    expect(mockOperationsService.handleRailwayWebhook).not.toHaveBeenCalled();
  });
});
