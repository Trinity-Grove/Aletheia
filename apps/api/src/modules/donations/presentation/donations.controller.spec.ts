import { DonationsController } from './donations.controller.js';
import { DonationWebhooksController } from './donation-webhooks.controller.js';
import type { DonationsService } from '../application/donations.service.js';
import type {
  CreateDonationIntentDto,
  DonationIntentResponseDto,
  DonationRecordResponseDto,
  SupporterSubscriptionResponseDto,
} from '@aletheia/contracts';

describe('DonationsController & DonationWebhooksController', () => {
  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const DONATION_ID = '22222222-2222-4222-8222-222222222222';
  const SUBSCRIPTION_ID = '33333333-3333-4333-8333-333333333333';

  let donationsController: DonationsController;
  let webhooksController: DonationWebhooksController;
  let mockService: jest.Mocked<DonationsService>;

  beforeEach(() => {
    mockService = {
      createIntent: jest.fn(),
      getStatus: jest.fn(),
      getHistory: jest.fn(),
      getSubscriptions: jest.fn(),
      cancelSubscription: jest.fn(),
      handleWebhook: jest.fn(),
    } as unknown as jest.Mocked<DonationsService>;

    donationsController = new DonationsController(mockService);
    webhooksController = new DonationWebhooksController(mockService);
  });

  describe('DonationsController', () => {
    describe('POST /create-intent', () => {
      it('delegates to DonationsService.createIntent with familyId and dto', async () => {
        const dto: CreateDonationIntentDto = {
          amountCents: 2000,
          frequency: 'ONE_TIME',
          paymentMethod: 'PIX',
        };

        const expectedResponse: DonationIntentResponseDto = {
          donationId: DONATION_ID,
          amountCents: 2000,
          currency: 'BRL',
          status: 'PENDING',
          paymentMethod: 'PIX',
          frequency: 'ONE_TIME',
          pixQrCodeUrl: 'data:image/svg+xml...',
          pixCopiaECola: 'copia_cola',
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        mockService.createIntent.mockResolvedValue(expectedResponse);

        const result = await donationsController.createIntent(FAMILY_ID, dto);

        expect(mockService.createIntent).toHaveBeenCalledWith(FAMILY_ID, dto);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('GET /:id/status', () => {
      it('delegates to DonationsService.getStatus with familyId and id', async () => {
        const expectedResponse: DonationRecordResponseDto = {
          id: DONATION_ID,
          familyId: FAMILY_ID,
          amountCents: 2000,
          currency: 'BRL',
          frequency: 'ONE_TIME',
          paymentMethod: 'PIX',
          status: 'CONFIRMED',
          pixCopiaECola: 'copia_cola',
          confirmedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        mockService.getStatus.mockResolvedValue(expectedResponse);

        const result = await donationsController.getStatus(FAMILY_ID, DONATION_ID);

        expect(mockService.getStatus).toHaveBeenCalledWith(FAMILY_ID, DONATION_ID);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('GET /history', () => {
      it('delegates to DonationsService.getHistory with familyId', async () => {
        const expectedResponse: DonationRecordResponseDto[] = [
          {
            id: DONATION_ID,
            familyId: FAMILY_ID,
            amountCents: 2000,
            currency: 'BRL',
            frequency: 'ONE_TIME',
            paymentMethod: 'PIX',
            status: 'CONFIRMED',
            pixCopiaECola: null,
            confirmedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ];

        mockService.getHistory.mockResolvedValue(expectedResponse);

        const result = await donationsController.getHistory(FAMILY_ID);

        expect(mockService.getHistory).toHaveBeenCalledWith(FAMILY_ID);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('GET /subscriptions', () => {
      it('delegates to DonationsService.getSubscriptions with familyId', async () => {
        const expectedResponse: SupporterSubscriptionResponseDto[] = [
          {
            id: SUBSCRIPTION_ID,
            familyId: FAMILY_ID,
            amountCents: 3500,
            currency: 'BRL',
            paymentMethod: 'CREDIT_CARD',
            status: 'CONFIRMED',
            gatewaySubscriptionId: 'mock_sub_123',
            cancelledAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        mockService.getSubscriptions.mockResolvedValue(expectedResponse);

        const result = await donationsController.getSubscriptions(FAMILY_ID);

        expect(mockService.getSubscriptions).toHaveBeenCalledWith(FAMILY_ID);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('DELETE /subscriptions/:id', () => {
      it('delegates to DonationsService.cancelSubscription with familyId and id', async () => {
        const expectedResponse: SupporterSubscriptionResponseDto = {
          id: SUBSCRIPTION_ID,
          familyId: FAMILY_ID,
          amountCents: 3500,
          currency: 'BRL',
          paymentMethod: 'CREDIT_CARD',
          status: 'CANCELLED',
          gatewaySubscriptionId: 'mock_sub_123',
          cancelledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        mockService.cancelSubscription.mockResolvedValue(expectedResponse);

        const result = await donationsController.cancelSubscription(
          FAMILY_ID,
          SUBSCRIPTION_ID,
        );

        expect(mockService.cancelSubscription).toHaveBeenCalledWith(
          FAMILY_ID,
          SUBSCRIPTION_ID,
        );
        expect(result).toEqual(expectedResponse);
      });
    });
  });

  describe('DonationWebhooksController', () => {
    describe('POST /:provider', () => {
      it('delegates to DonationsService.handleWebhook with provider, body, and signature', async () => {
        const payload = { action: 'payment.updated', data: { id: 'mp_123' } };
        mockService.handleWebhook.mockResolvedValue({ received: true });

        const result = await webhooksController.handleWebhook(
          'mercadopago',
          payload,
          'v1,ts=123,sig=abc',
        );

        expect(mockService.handleWebhook).toHaveBeenCalledWith(
          'mercadopago',
          payload,
          'v1,ts=123,sig=abc',
        );
        expect(result).toEqual({ received: true });
      });
    });
  });
});
