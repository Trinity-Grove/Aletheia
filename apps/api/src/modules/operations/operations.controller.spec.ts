import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard, PlatformAdminGuard } from '../../platform/auth/index.js';
import { OperationsController } from './operations.controller.js';
import type { OperationsService } from './operations.service.js';
import type {
  OperationalAlertEventDto,
  OperationalStatusResponseDto,
} from '@aletheia/contracts';

describe('OperationsController', () => {
  let controller: OperationsController;
  let mockOperationsService: jest.Mocked<OperationsService>;

  beforeEach(() => {
    mockOperationsService = {
      getStatus: jest.fn(),
      listAlerts: jest.fn(),
      acknowledgeAlert: jest.fn(),
      handleRailwayWebhook: jest.fn(),
    } as unknown as jest.Mocked<OperationsService>;

    controller = new OperationsController(mockOperationsService);
  });

  it('has JwtAuthGuard and PlatformAdminGuard applied to the controller class', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, OperationsController);
    expect(guards).toBeDefined();
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(PlatformAdminGuard);
  });

  describe('GET /status', () => {
    it('delegates to operationsService.getStatus', async () => {
      const mockStatus: OperationalStatusResponseDto = {
        service: 'aletheia-api',
        version: '0.1.0',
        uptimeSeconds: 120,
        timestamp: new Date().toISOString(),
        overallHealth: 'HEALTHY',
        dependencies: {
          postgres: { status: 'UP', responseTimeMs: 2 },
          objectStorage: { status: 'UP', responseTimeMs: 5 },
          redis: { status: 'NOT_CONFIGURED', responseTimeMs: 0 },
        },
        resources: {
          memoryHeapUsedMb: 50,
          memoryHeapTotalMb: 100,
          memoryRssMb: 120,
          nodeVersion: 'v24.13.3',
        },
        railwayDashboardLinks: {},
      };

      mockOperationsService.getStatus.mockResolvedValue(mockStatus);

      const result = await controller.getStatus();

      expect(mockOperationsService.getStatus).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockStatus);
    });
  });

  describe('GET /alerts', () => {
    it('delegates to operationsService.listAlerts with parsed query parameters', async () => {
      const mockAlerts: OperationalAlertEventDto[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          source: 'RAILWAY',
          eventType: 'DEPLOY',
          severity: 'WARNING',
          serviceName: 'api',
          message: 'Deploy high memory warning',
          payload: {},
          receivedAt: new Date().toISOString(),
          acknowledgedAt: null,
          acknowledgedBy: null,
        },
      ];

      mockOperationsService.listAlerts.mockResolvedValue(mockAlerts);

      const result = await controller.listAlerts('20', 'true');

      expect(mockOperationsService.listAlerts).toHaveBeenCalledWith({
        limit: 20,
        acknowledged: true,
      });
      expect(result).toEqual(mockAlerts);
    });

    it('passes empty object when query parameters are omitted', async () => {
      mockOperationsService.listAlerts.mockResolvedValue([]);

      await controller.listAlerts(undefined, undefined);

      expect(mockOperationsService.listAlerts).toHaveBeenCalledWith({});
    });
  });

  describe('POST /alerts/:id/acknowledge', () => {
    it('delegates to operationsService.acknowledgeAlert with body notes', async () => {
      const alertId = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
      const mockAcknowledged: OperationalAlertEventDto = {
        id: alertId,
        source: 'RAILWAY',
        eventType: 'DEPLOY',
        severity: 'WARNING',
        serviceName: 'api',
        message: 'Deploy high memory warning',
        payload: { acknowledgmentNotes: 'Reviewed' },
        receivedAt: new Date().toISOString(),
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: userId,
      };

      mockOperationsService.acknowledgeAlert.mockResolvedValue(mockAcknowledged);

      const result = await controller.acknowledgeAlert(
        alertId,
        userId,
        { notes: 'Reviewed' },
      );

      expect(mockOperationsService.acknowledgeAlert).toHaveBeenCalledWith(
        alertId,
        userId,
        'Reviewed',
      );
      expect(result).toEqual(mockAcknowledged);
    });
  });
});
