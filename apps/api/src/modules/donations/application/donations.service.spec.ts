import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DonationsService } from './donations.service.js';
import type { DonationsRepository } from '../infrastructure/donations.repository.js';
import type {
  DonationGateway,
  WebhookEventResult,
} from '../infrastructure/donation-gateway.interface.js';
import type {
  CreateDonationIntentDto,
  DonationFrequency,
  DonationPaymentMethod,
  DonationStatus,
} from '@aletheia/contracts';

describe('DonationsService', () => {
  let service: DonationsService;
  let mockRepository: jest.Mocked<DonationsRepository>;
  let mockGateway: jest.Mocked<DonationGateway>;

  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const OTHER_FAMILY_ID = '99999999-9999-4999-8999-999999999999';
  const DONATION_ID = '22222222-2222-4222-8222-222222222222';
  const SUBSCRIPTION_ID = '33333333-3333-4333-8333-333333333333';
  const NOW = new Date('2026-09-18T20:00:00.000Z');

  beforeEach(() => {
    mockRepository = {
      findUserEmail: jest.fn().mockResolvedValue(null),
      createDonationRecord: jest.fn(),
      findDonationRecordById: jest.fn(),
      findDonationRecordByGatewayTransactionId: jest.fn(),
      updateDonationRecordStatus: jest.fn(),
      updateDonationRecordGatewayData: jest.fn(),
      listDonationRecordsByFamilyId: jest.fn(),
      createSupporterSubscription: jest.fn(),
      findSupporterSubscriptionById: jest.fn(),
      findSupporterSubscriptionByGatewayId: jest.fn(),
      listSupporterSubscriptionsByFamilyId: jest.fn(),
      updateSupporterSubscriptionStatus: jest.fn(),
    } as unknown as jest.Mocked<DonationsRepository>;

    mockGateway = {
      createOneTimeIntent: jest.fn(),
      createSubscriptionIntent: jest.fn(),
      cancelSubscription: jest.fn(),
      parseWebhook: jest.fn(),
    };

    service = new DonationsService(mockRepository, mockGateway);
  });

  describe('createIntent', () => {
    it('throws BadRequestException if amount is below 500 cents (R$ 5,00)', async () => {
      const dto: CreateDonationIntentDto = {
        amountCents: 499,
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
      };

      await expect(service.createIntent(FAMILY_ID, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepository.createDonationRecord).not.toHaveBeenCalled();
      expect(mockGateway.createOneTimeIntent).not.toHaveBeenCalled();
    });

    it('creates ONE_TIME PIX donation intent successfully with QR code', async () => {
      const dto: CreateDonationIntentDto = {
        amountCents: 2500,
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
        donorName: 'Carlos Silva',
        donorEmail: 'carlos@example.com',
      };

      const initialRecord = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: 'Carlos Silva',
        donorEmail: 'carlos@example.com',
        amountCents: 2500,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: null,
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.createDonationRecord.mockResolvedValue(initialRecord);

      mockGateway.createOneTimeIntent.mockResolvedValue({
        gatewayTransactionId: 'mock_tx_123',
        pixQrCodeUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        pixCopiaECola: '00020126580014br.gov.bcb.pix...',
        expiresAt: new Date(NOW.getTime() + 30 * 60 * 1000),
      });

      const result = await service.createIntent(FAMILY_ID, dto);

      expect(mockRepository.createDonationRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: FAMILY_ID,
          amountCents: 2500,
          frequency: 'ONE_TIME',
          paymentMethod: 'PIX',
          status: 'PENDING',
        }),
      );

      expect(mockGateway.createOneTimeIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          donationId: DONATION_ID,
          amountCents: 2500,
          paymentMethod: 'PIX',
        }),
      );

      expect(mockRepository.updateDonationRecordGatewayData).toHaveBeenCalledWith(
        DONATION_ID,
        expect.objectContaining({
          gatewayTransactionId: 'mock_tx_123',
          pixQrCodeUrl: 'data:image/svg+xml;utf8,<svg></svg>',
          pixCopiaECola: '00020126580014br.gov.bcb.pix...',
        }),
      );

      expect(result).toMatchObject({
        donationId: DONATION_ID,
        amountCents: 2500,
        currency: 'BRL',
        status: 'PENDING',
        paymentMethod: 'PIX',
        frequency: 'ONE_TIME',
        pixQrCodeUrl: 'data:image/svg+xml;utf8,<svg></svg>',
        pixCopiaECola: '00020126580014br.gov.bcb.pix...',
      });
    });

    it('falls back to the logged-in account email when donorEmail is left blank -- Mercado Pago requires payer.email (found live in production)', async () => {
      const USER_ID = '55555555-5555-4555-8555-555555555555';
      const dto: CreateDonationIntentDto = {
        amountCents: 1500,
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
      };

      mockRepository.findUserEmail.mockResolvedValue('guardian@example.com');
      mockRepository.createDonationRecord.mockResolvedValue({
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: 'guardian@example.com',
        amountCents: 1500,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: null,
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      });
      mockGateway.createOneTimeIntent.mockResolvedValue({
        gatewayTransactionId: 'mock_tx_456',
        expiresAt: new Date(NOW.getTime() + 30 * 60 * 1000),
      });

      await service.createIntent(FAMILY_ID, dto, USER_ID);

      expect(mockRepository.findUserEmail).toHaveBeenCalledWith(USER_ID);
      expect(mockRepository.createDonationRecord).toHaveBeenCalledWith(
        expect.objectContaining({ donorEmail: 'guardian@example.com' }),
      );
      expect(mockGateway.createOneTimeIntent).toHaveBeenCalledWith(
        expect.objectContaining({ donorEmail: 'guardian@example.com' }),
      );
    });

    it('prefers an explicitly given donorEmail over the account email', async () => {
      const USER_ID = '66666666-6666-4666-8666-666666666666';
      const dto: CreateDonationIntentDto = {
        amountCents: 1500,
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
        donorEmail: 'explicit-donor@example.com',
      };

      mockRepository.findUserEmail.mockResolvedValue('guardian@example.com');
      mockRepository.createDonationRecord.mockResolvedValue({
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: 'explicit-donor@example.com',
        amountCents: 1500,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: null,
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      });
      mockGateway.createOneTimeIntent.mockResolvedValue({
        gatewayTransactionId: 'mock_tx_789',
        expiresAt: new Date(NOW.getTime() + 30 * 60 * 1000),
      });

      await service.createIntent(FAMILY_ID, dto, USER_ID);

      expect(mockGateway.createOneTimeIntent).toHaveBeenCalledWith(
        expect.objectContaining({ donorEmail: 'explicit-donor@example.com' }),
      );
    });

    it('does not look up an account email when no currentUserId is given (e.g. an unauthenticated or system-initiated call)', async () => {
      const dto: CreateDonationIntentDto = {
        amountCents: 1500,
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
      };

      mockRepository.createDonationRecord.mockResolvedValue({
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: null,
        amountCents: 1500,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: null,
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      });
      mockGateway.createOneTimeIntent.mockResolvedValue({
        gatewayTransactionId: 'mock_tx_000',
        expiresAt: new Date(NOW.getTime() + 30 * 60 * 1000),
      });

      await service.createIntent(FAMILY_ID, dto);

      expect(mockRepository.findUserEmail).not.toHaveBeenCalled();
      expect(mockGateway.createOneTimeIntent).toHaveBeenCalledWith(
        expect.objectContaining({ donorEmail: undefined }),
      );
    });

    it('creates ONE_TIME CREDIT_CARD donation intent with gateway client secret', async () => {
      const dto: CreateDonationIntentDto = {
        amountCents: 5000,
        frequency: 'ONE_TIME',
        paymentMethod: 'CREDIT_CARD',
      };

      const initialRecord = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: null,
        amountCents: 5000,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: null,
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.createDonationRecord.mockResolvedValue(initialRecord);

      mockGateway.createOneTimeIntent.mockResolvedValue({
        gatewayTransactionId: 'mock_tx_card_456',
        clientSecret: 'mock_secret_token',
        expiresAt: new Date(NOW.getTime() + 30 * 60 * 1000),
      });

      const result = await service.createIntent(FAMILY_ID, dto);

      expect(result).toMatchObject({
        donationId: DONATION_ID,
        amountCents: 5000,
        status: 'PENDING',
        paymentMethod: 'CREDIT_CARD',
        frequency: 'ONE_TIME',
        gatewayClientSecret: 'mock_secret_token',
      });
    });

    it('creates MONTHLY subscription and initial pending donation record', async () => {
      const dto: CreateDonationIntentDto = {
        amountCents: 3500,
        frequency: 'MONTHLY',
        paymentMethod: 'CREDIT_CARD',
        donorName: 'Mariana Lima',
        donorEmail: 'mariana@example.com',
      };

      mockGateway.createSubscriptionIntent.mockResolvedValue({
        gatewaySubscriptionId: 'mock_sub_789',
        clientSecret: 'mock_sub_token_789',
        nextBillingAt: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000),
      });

      const createdSub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3500,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_789',
        cancelledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.createSupporterSubscription.mockResolvedValue(createdSub);

      const initialRecord = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: 'Mariana Lima',
        donorEmail: 'mariana@example.com',
        amountCents: 3500,
        currency: 'BRL',
        frequency: 'MONTHLY' as DonationFrequency,
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: null,
        gatewaySubscriptionId: 'mock_sub_789',
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.createDonationRecord.mockResolvedValue(initialRecord);

      const result = await service.createIntent(FAMILY_ID, dto);

      expect(mockGateway.createSubscriptionIntent).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: FAMILY_ID,
          amountCents: 3500,
          paymentMethod: 'CREDIT_CARD',
        }),
      );

      expect(mockRepository.createSupporterSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: FAMILY_ID,
          amountCents: 3500,
          paymentMethod: 'CREDIT_CARD',
          status: 'PENDING',
          gatewaySubscriptionId: 'mock_sub_789',
        }),
      );

      expect(mockRepository.createDonationRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: FAMILY_ID,
          amountCents: 3500,
          frequency: 'MONTHLY',
          paymentMethod: 'CREDIT_CARD',
          status: 'PENDING',
          gatewaySubscriptionId: 'mock_sub_789',
        }),
      );

      expect(result).toMatchObject({
        donationId: DONATION_ID,
        amountCents: 3500,
        status: 'PENDING',
        frequency: 'MONTHLY',
        paymentMethod: 'CREDIT_CARD',
        gatewayClientSecret: 'mock_sub_token_789',
      });
    });
  });

  describe('getStatus', () => {
    it('returns donation record when found within tenant family', async () => {
      const record = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: 'Carlos Silva',
        donorEmail: 'carlos@example.com',
        amountCents: 2500,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'CONFIRMED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: 'tx_123',
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: 'copia_cola',
        notes: null,
        confirmedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findDonationRecordById.mockResolvedValue(record);

      const result = await service.getStatus(FAMILY_ID, DONATION_ID);

      expect(mockRepository.findDonationRecordById).toHaveBeenCalledWith(
        DONATION_ID,
        FAMILY_ID,
      );
      expect(result).toEqual({
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: 'Carlos Silva',
        donorEmail: 'carlos@example.com',
        amountCents: 2500,
        currency: 'BRL',
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
        status: 'CONFIRMED',
        pixCopiaECola: 'copia_cola',
        confirmedAt: NOW.toISOString(),
        createdAt: NOW.toISOString(),
      });
    });

    it('throws NotFoundException if record does not exist or belongs to another family', async () => {
      mockRepository.findDonationRecordById.mockResolvedValue(null);

      await expect(service.getStatus(OTHER_FAMILY_ID, DONATION_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getHistory', () => {
    it('returns list of donation records scoped to family', async () => {
      const record = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: 'Carlos Silva',
        donorEmail: null,
        amountCents: 1500,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'CONFIRMED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: 'tx_123',
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.listDonationRecordsByFamilyId.mockResolvedValue([record]);

      const result = await service.getHistory(FAMILY_ID);

      expect(mockRepository.listDonationRecordsByFamilyId).toHaveBeenCalledWith(
        FAMILY_ID,
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(DONATION_ID);
      expect(result[0]?.familyId).toBe(FAMILY_ID);
    });
  });

  describe('getSubscriptions', () => {
    it('returns list of supporter subscriptions scoped to family', async () => {
      const sub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'CONFIRMED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_abc',
        cancelledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.listSupporterSubscriptionsByFamilyId.mockResolvedValue([sub]);

      const result = await service.getSubscriptions(FAMILY_ID);

      expect(mockRepository.listSupporterSubscriptionsByFamilyId).toHaveBeenCalledWith(
        FAMILY_ID,
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(SUBSCRIPTION_ID);
      expect(result[0]?.gatewaySubscriptionId).toBe('mock_sub_abc');
    });
  });

  describe('cancelSubscription', () => {
    it('cancels subscription in gateway and repository when owned by family', async () => {
      const sub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'CONFIRMED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_abc',
        cancelledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findSupporterSubscriptionById.mockResolvedValue(sub);
      mockGateway.cancelSubscription.mockResolvedValue();
      mockRepository.updateSupporterSubscriptionStatus.mockResolvedValue({
        ...sub,
        status: 'CANCELLED',
        cancelledAt: NOW,
      });

      const result = await service.cancelSubscription(FAMILY_ID, SUBSCRIPTION_ID);

      expect(mockRepository.findSupporterSubscriptionById).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        FAMILY_ID,
      );
      expect(mockGateway.cancelSubscription).toHaveBeenCalledWith('mock_sub_abc');
      expect(mockRepository.updateSupporterSubscriptionStatus).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        'CANCELLED',
        expect.any(Date),
      );
      expect(result.status).toBe('CANCELLED');
    });

    it('throws NotFoundException if subscription belongs to another family', async () => {
      mockRepository.findSupporterSubscriptionById.mockResolvedValue(null);

      await expect(
        service.cancelSubscription(OTHER_FAMILY_ID, SUBSCRIPTION_ID),
      ).rejects.toThrow(NotFoundException);

      expect(mockGateway.cancelSubscription).not.toHaveBeenCalled();
      expect(mockRepository.updateSupporterSubscriptionStatus).not.toHaveBeenCalled();
    });
  });

  describe('handleWebhook (Idempotency & Processing)', () => {
    it('confirms pending donation record on confirmed webhook event', async () => {
      const webhookEvent: WebhookEventResult = {
        eventId: 'evt_1',
        eventType: 'payment.updated',
        gatewayTransactionId: 'tx_xyz',
        status: 'CONFIRMED',
        paidAt: NOW,
      };

      mockGateway.parseWebhook.mockResolvedValue(webhookEvent);

      const pendingRecord = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: null,
        amountCents: 2000,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: 'tx_xyz',
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findDonationRecordByGatewayTransactionId.mockResolvedValue(
        pendingRecord,
      );

      const response = await service.handleWebhook('mock', { raw: 'data' }, 'sig_header');

      expect(mockGateway.parseWebhook).toHaveBeenCalledWith(
        { raw: 'data' },
        expect.objectContaining({ 'x-signature': 'sig_header' }),
        undefined,
      );
      expect(mockRepository.updateDonationRecordStatus).toHaveBeenCalledWith(
        DONATION_ID,
        'CONFIRMED',
        NOW,
      );
      expect(response).toEqual({ received: true });
    });

    it('is strictly idempotent: does not re-update or throw when transaction is ALREADY CONFIRMED', async () => {
      const webhookEvent: WebhookEventResult = {
        eventId: 'evt_dup',
        eventType: 'payment.updated',
        gatewayTransactionId: 'tx_xyz',
        status: 'CONFIRMED',
        paidAt: NOW,
      };

      mockGateway.parseWebhook.mockResolvedValue(webhookEvent);

      const alreadyConfirmedRecord = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: null,
        amountCents: 2000,
        currency: 'BRL',
        frequency: 'ONE_TIME' as DonationFrequency,
        paymentMethod: 'PIX' as DonationPaymentMethod,
        status: 'CONFIRMED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: 'tx_xyz',
        gatewaySubscriptionId: null,
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findDonationRecordByGatewayTransactionId.mockResolvedValue(
        alreadyConfirmedRecord,
      );

      const response = await service.handleWebhook('mock', { raw: 'duplicate' });

      // IDEMPOTENT NO-OP: MUST NOT call updateDonationRecordStatus again!
      expect(mockRepository.updateDonationRecordStatus).not.toHaveBeenCalled();
      expect(response).toEqual({ received: true, idempotent: true });
    });

    it('updates subscription status when subscription webhook arrives', async () => {
      const webhookEvent: WebhookEventResult = {
        eventId: 'evt_sub_cancel',
        eventType: 'subscription.cancelled',
        gatewaySubscriptionId: 'mock_sub_xyz',
        status: 'CANCELLED',
      };

      mockGateway.parseWebhook.mockResolvedValue(webhookEvent);

      const existingSub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'CONFIRMED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_xyz',
        cancelledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findSupporterSubscriptionByGatewayId.mockResolvedValue(existingSub);

      const response = await service.handleWebhook('mock', { raw: 'sub' });

      expect(mockRepository.updateSupporterSubscriptionStatus).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        'CANCELLED',
        expect.any(Date),
      );
      expect(response).toEqual({ received: true });
    });

    it('is idempotent for subscription webhook when status matches already', async () => {
      const webhookEvent: WebhookEventResult = {
        eventId: 'evt_sub_dup',
        eventType: 'subscription.cancelled',
        gatewaySubscriptionId: 'mock_sub_xyz',
        status: 'CANCELLED',
      };

      mockGateway.parseWebhook.mockResolvedValue(webhookEvent);

      const alreadyCancelledSub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'CANCELLED' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_xyz',
        cancelledAt: NOW,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findSupporterSubscriptionByGatewayId.mockResolvedValue(
        alreadyCancelledSub,
      );

      const response = await service.handleWebhook('mock', { raw: 'sub_dup' });

      expect(mockRepository.updateSupporterSubscriptionStatus).not.toHaveBeenCalled();
      expect(response).toEqual({ received: true, idempotent: true });
    });

    it('handles gracefully when transaction is not found in repository', async () => {
      mockGateway.parseWebhook.mockResolvedValue({
        eventId: 'evt_unknown',
        eventType: 'payment.updated',
        gatewayTransactionId: 'tx_unknown',
        status: 'CONFIRMED',
      });

      mockRepository.findDonationRecordByGatewayTransactionId.mockResolvedValue(null);

      const response = await service.handleWebhook('mock', { raw: 'unknown' });

      expect(mockRepository.updateDonationRecordStatus).not.toHaveBeenCalled();
      expect(response).toEqual({ received: true, handled: false });
    });

    it('falls through to check subscription when gatewayTransactionId is not found in repository', async () => {
      const webhookEvent: WebhookEventResult = {
        eventId: 'evt_fallthrough',
        eventType: 'payment.updated',
        gatewayTransactionId: 'tx_unmatched',
        gatewaySubscriptionId: 'mock_sub_xyz',
        status: 'CONFIRMED',
        paidAt: NOW,
      };

      mockGateway.parseWebhook.mockResolvedValue(webhookEvent);
      mockRepository.findDonationRecordByGatewayTransactionId.mockResolvedValue(null);

      const existingSub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_xyz',
        cancelledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findSupporterSubscriptionByGatewayId.mockResolvedValue(existingSub);

      const response = await service.handleWebhook('mock', { raw: 'data' });

      expect(mockRepository.findDonationRecordByGatewayTransactionId).toHaveBeenCalledWith('tx_unmatched');
      expect(mockRepository.findSupporterSubscriptionByGatewayId).toHaveBeenCalledWith('mock_sub_xyz');
      expect(mockRepository.updateSupporterSubscriptionStatus).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        'CONFIRMED',
        null,
      );
      expect(response).toEqual({ received: true });
    });

    it('handles both transaction and subscription updates when both are matched in a single event', async () => {
      const webhookEvent: WebhookEventResult = {
        eventId: 'evt_both',
        eventType: 'payment.updated',
        gatewayTransactionId: 'tx_matched',
        gatewaySubscriptionId: 'mock_sub_xyz',
        status: 'CONFIRMED',
        paidAt: NOW,
      };

      mockGateway.parseWebhook.mockResolvedValue(webhookEvent);

      const pendingRecord = {
        id: DONATION_ID,
        familyId: FAMILY_ID,
        donorName: null,
        donorEmail: null,
        amountCents: 3000,
        currency: 'BRL',
        frequency: 'MONTHLY' as DonationFrequency,
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewayTransactionId: 'tx_matched',
        gatewaySubscriptionId: 'mock_sub_xyz',
        pixQrCodeUrl: null,
        pixCopiaECola: null,
        notes: null,
        confirmedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      const pendingSub = {
        id: SUBSCRIPTION_ID,
        familyId: FAMILY_ID,
        amountCents: 3000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD' as DonationPaymentMethod,
        status: 'PENDING' as DonationStatus,
        gatewayProvider: 'mock',
        gatewaySubscriptionId: 'mock_sub_xyz',
        cancelledAt: null,
        createdAt: NOW,
        updatedAt: NOW,
      };

      mockRepository.findDonationRecordByGatewayTransactionId.mockResolvedValue(pendingRecord);
      mockRepository.findSupporterSubscriptionByGatewayId.mockResolvedValue(pendingSub);

      const response = await service.handleWebhook('mock', { raw: 'both' });

      expect(mockRepository.updateDonationRecordStatus).toHaveBeenCalledWith(
        DONATION_ID,
        'CONFIRMED',
        NOW,
      );
      expect(mockRepository.updateSupporterSubscriptionStatus).toHaveBeenCalledWith(
        SUBSCRIPTION_ID,
        'CONFIRMED',
        null,
      );
      expect(response).toEqual({ received: true });
    });
  });
});
