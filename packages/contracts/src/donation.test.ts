import { describe, expect, it } from 'vitest';
import {
  createDonationIntentSchema,
  donationFrequencySchema,
  donationIntentResponseSchema,
  donationPaymentMethodSchema,
  donationRecordResponseSchema,
  donationStatusSchema,
  donationWebhookPayloadSchema,
  supporterSubscriptionResponseSchema,
  type CreateDonationIntentDto,
  type CreateDonationIntentOutput,
  type DonationFrequency,
  type DonationIntentResponseDto,
  type DonationPaymentMethod,
  type DonationRecordResponseDto,
  type DonationStatus,
  type DonationWebhookPayloadDto,
  type SupporterSubscriptionResponseDto,
} from './donation.js';

describe('donation contracts', () => {
  describe('donationFrequencySchema', () => {
    it('accepts valid donation frequencies', () => {
      const validFrequencies: DonationFrequency[] = ['ONE_TIME', 'MONTHLY'];
      for (const freq of validFrequencies) {
        expect(donationFrequencySchema.safeParse(freq).success).toBe(true);
      }
    });

    it('rejects invalid donation frequencies', () => {
      expect(donationFrequencySchema.safeParse('YEARLY').success).toBe(false);
      expect(donationFrequencySchema.safeParse('WEEKLY').success).toBe(false);
      expect(donationFrequencySchema.safeParse('').success).toBe(false);
      expect(donationFrequencySchema.safeParse(null).success).toBe(false);
    });
  });

  describe('donationPaymentMethodSchema', () => {
    it('accepts valid payment methods', () => {
      const validMethods: DonationPaymentMethod[] = ['PIX', 'GOOGLE_PAY', 'CREDIT_CARD'];
      for (const method of validMethods) {
        expect(donationPaymentMethodSchema.safeParse(method).success).toBe(true);
      }
    });

    it('rejects invalid payment methods', () => {
      expect(donationPaymentMethodSchema.safeParse('BOLETO').success).toBe(false);
      expect(donationPaymentMethodSchema.safeParse('PAYPAL').success).toBe(false);
      expect(donationPaymentMethodSchema.safeParse('').success).toBe(false);
      expect(donationPaymentMethodSchema.safeParse(123).success).toBe(false);
    });
  });

  describe('donationStatusSchema', () => {
    it('accepts valid donation statuses', () => {
      const validStatuses: DonationStatus[] = ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'];
      for (const status of validStatuses) {
        expect(donationStatusSchema.safeParse(status).success).toBe(true);
      }
    });

    it('rejects invalid donation statuses', () => {
      expect(donationStatusSchema.safeParse('COMPLETED').success).toBe(false);
      expect(donationStatusSchema.safeParse('REFUNDED').success).toBe(false);
      expect(donationStatusSchema.safeParse('').success).toBe(false);
    });
  });

  describe('createDonationIntentSchema', () => {
    it('applies defaults for frequency and paymentMethod when omitted', () => {
      const input: CreateDonationIntentDto = {
        amountCents: 1500,
      };

      const result = createDonationIntentSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        const output: CreateDonationIntentOutput = result.data;
        expect(output.amountCents).toBe(1500);
        expect(output.frequency).toBe('ONE_TIME');
        expect(output.paymentMethod).toBe('PIX');
        expect(output.donorName).toBeUndefined();
        expect(output.donorEmail).toBeUndefined();
      }
    });

    it('accepts a fully specified payload with optional donor information', () => {
      const input: CreateDonationIntentDto = {
        amountCents: 5000,
        frequency: 'MONTHLY',
        paymentMethod: 'CREDIT_CARD',
        donorName: 'Maria Silva',
        donorEmail: 'maria@example.com',
      };

      const result = createDonationIntentSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amountCents).toBe(5000);
        expect(result.data.frequency).toBe('MONTHLY');
        expect(result.data.paymentMethod).toBe('CREDIT_CARD');
        expect(result.data.donorName).toBe('Maria Silva');
        expect(result.data.donorEmail).toBe('maria@example.com');
      }
    });

    it('rejects a MONTHLY + PIX combination -- Mercado Pago subscriptions are card-based, no recurring PIX exists', () => {
      const result = createDonationIntentSchema.safeParse({
        amountCents: 3000,
        frequency: 'MONTHLY',
        paymentMethod: 'PIX',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(['paymentMethod']);
      }
    });

    it('accepts MONTHLY + GOOGLE_PAY', () => {
      const result = createDonationIntentSchema.safeParse({
        amountCents: 3000,
        frequency: 'MONTHLY',
        paymentMethod: 'GOOGLE_PAY',
      });
      expect(result.success).toBe(true);
    });

    it('accepts ONE_TIME + PIX', () => {
      const result = createDonationIntentSchema.safeParse({
        amountCents: 3000,
        frequency: 'ONE_TIME',
        paymentMethod: 'PIX',
      });
      expect(result.success).toBe(true);
    });

    it('enforces minimum amount of 500 cents (R$ 5,00)', () => {
      expect(createDonationIntentSchema.safeParse({ amountCents: 500 }).success).toBe(true);
      expect(createDonationIntentSchema.safeParse({ amountCents: 499 }).success).toBe(false);
      expect(createDonationIntentSchema.safeParse({ amountCents: 0 }).success).toBe(false);
      expect(createDonationIntentSchema.safeParse({ amountCents: -500 }).success).toBe(false);
    });

    it('enforces integer amounts', () => {
      expect(createDonationIntentSchema.safeParse({ amountCents: 500.5 }).success).toBe(false);
    });

    it('validates donorName constraints', () => {
      expect(
        createDonationIntentSchema.safeParse({
          amountCents: 1000,
          donorName: 'A',
        }).success,
      ).toBe(false);

      expect(
        createDonationIntentSchema.safeParse({
          amountCents: 1000,
          donorName: 'A'.repeat(151),
        }).success,
      ).toBe(false);

      expect(
        createDonationIntentSchema.safeParse({
          amountCents: 1000,
          donorName: 'A'.repeat(150),
        }).success,
      ).toBe(true);
    });

    it('validates donorEmail format', () => {
      expect(
        createDonationIntentSchema.safeParse({
          amountCents: 1000,
          donorEmail: 'invalid-email',
        }).success,
      ).toBe(false);

      expect(
        createDonationIntentSchema.safeParse({
          amountCents: 1000,
          donorEmail: 'valid.donor@example.com',
        }).success,
      ).toBe(true);
    });
  });

  describe('donationIntentResponseSchema', () => {
    it('validates a valid response object', () => {
      const response: DonationIntentResponseDto = {
        donationId: '123e4567-e89b-12d3-a456-426614174000',
        amountCents: 2500,
        currency: 'BRL',
        status: 'PENDING',
        paymentMethod: 'PIX',
        frequency: 'ONE_TIME',
        pixQrCodeUrl: 'https://pix.example.com/qr/123.png',
        pixCopiaECola: '00020126580014br.gov.bcb.pix...',
        gatewayClientSecret: 'pi_test_secret_123',
        expiresAt: '2026-09-18T20:30:00.000Z',
        createdAt: '2026-09-18T20:00:00.000Z',
      };

      const result = donationIntentResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('rejects invalid donationId or currency', () => {
      const invalid = {
        donationId: 'not-a-uuid',
        amountCents: 2500,
        currency: 'USD',
        status: 'PENDING',
        paymentMethod: 'PIX',
        frequency: 'ONE_TIME',
        expiresAt: '2026-09-18T20:30:00.000Z',
        createdAt: '2026-09-18T20:00:00.000Z',
      };

      expect(donationIntentResponseSchema.safeParse(invalid).success).toBe(false);
    });

    it('validates a MONTHLY response carrying a hosted authorizationUrl', () => {
      const response: DonationIntentResponseDto = {
        donationId: '123e4567-e89b-12d3-a456-426614174000',
        amountCents: 5000,
        currency: 'BRL',
        status: 'PENDING',
        paymentMethod: 'GOOGLE_PAY',
        frequency: 'MONTHLY',
        authorizationUrl: 'https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=abc123',
        expiresAt: '2026-09-18T20:30:00.000Z',
        createdAt: '2026-09-18T20:00:00.000Z',
      };

      expect(donationIntentResponseSchema.safeParse(response).success).toBe(true);
    });
  });

  describe('donationRecordResponseSchema', () => {
    it('validates record response with full fields', () => {
      const record: DonationRecordResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        familyId: '123e4567-e89b-12d3-a456-426614174002',
        donorName: 'João da Silva',
        donorEmail: 'joao@example.com',
        amountCents: 3000,
        currency: 'BRL',
        frequency: 'MONTHLY',
        paymentMethod: 'PIX',
        status: 'CONFIRMED',
        pixCopiaECola: '00020126...',
        confirmedAt: '2026-09-18T20:05:00.000Z',
        createdAt: '2026-09-18T20:00:00.000Z',
      };

      expect(donationRecordResponseSchema.safeParse(record).success).toBe(true);
    });

    it('allows nullish optional fields in record response', () => {
      const recordWithNulls: DonationRecordResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        familyId: null,
        donorName: null,
        donorEmail: null,
        amountCents: 1000,
        currency: 'BRL',
        frequency: 'ONE_TIME',
        paymentMethod: 'GOOGLE_PAY',
        status: 'PENDING',
        pixCopiaECola: null,
        confirmedAt: null,
        createdAt: '2026-09-18T20:00:00.000Z',
      };

      expect(donationRecordResponseSchema.safeParse(recordWithNulls).success).toBe(true);

      const recordWithUndefined = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        amountCents: 1000,
        currency: 'BRL',
        frequency: 'ONE_TIME',
        paymentMethod: 'GOOGLE_PAY',
        status: 'PENDING',
        createdAt: '2026-09-18T20:00:00.000Z',
      };

      expect(donationRecordResponseSchema.safeParse(recordWithUndefined).success).toBe(true);
    });

    it('rejects invalid record response', () => {
      expect(
        donationRecordResponseSchema.safeParse({
          id: 'invalid-id',
          amountCents: 'ten',
          currency: 'BRL',
          frequency: 'ONE_TIME',
          paymentMethod: 'PIX',
          status: 'PENDING',
          createdAt: '2026-09-18T20:00:00.000Z',
        }).success,
      ).toBe(false);
    });
  });

  describe('supporterSubscriptionResponseSchema', () => {
    it('validates active supporter subscription response', () => {
      const sub: SupporterSubscriptionResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        familyId: '123e4567-e89b-12d3-a456-426614174020',
        amountCents: 5000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD',
        status: 'CONFIRMED',
        gatewaySubscriptionId: 'sub_gateway_abc123',
        cancelledAt: null,
        createdAt: '2026-09-18T10:00:00.000Z',
        updatedAt: '2026-09-18T10:00:00.000Z',
      };

      expect(supporterSubscriptionResponseSchema.safeParse(sub).success).toBe(true);
    });

    it('validates cancelled supporter subscription response', () => {
      const sub: SupporterSubscriptionResponseDto = {
        id: '123e4567-e89b-12d3-a456-426614174010',
        familyId: '123e4567-e89b-12d3-a456-426614174020',
        amountCents: 5000,
        currency: 'BRL',
        paymentMethod: 'CREDIT_CARD',
        status: 'CANCELLED',
        gatewaySubscriptionId: 'sub_gateway_abc123',
        cancelledAt: '2026-09-18T12:00:00.000Z',
        createdAt: '2026-09-18T10:00:00.000Z',
        updatedAt: '2026-09-18T12:00:00.000Z',
      };

      expect(supporterSubscriptionResponseSchema.safeParse(sub).success).toBe(true);
    });

    it('rejects invalid uuid or missing fields in supporter subscription', () => {
      expect(
        supporterSubscriptionResponseSchema.safeParse({
          id: 'not-uuid',
          familyId: 'not-uuid',
          amountCents: 5000,
          currency: 'BRL',
          paymentMethod: 'CREDIT_CARD',
          status: 'CONFIRMED',
          gatewaySubscriptionId: 'sub_123',
          createdAt: '2026-09-18T10:00:00.000Z',
          updatedAt: '2026-09-18T10:00:00.000Z',
        }).success,
      ).toBe(false);
    });
  });

  describe('donationWebhookPayloadSchema', () => {
    it('validates full webhook payload', () => {
      const payload: DonationWebhookPayloadDto = {
        event: 'payment.confirmed',
        gatewayTransactionId: 'tx_mp_123456',
        gatewaySubscriptionId: 'sub_mp_789012',
        status: 'CONFIRMED',
        amountCents: 3000,
        paidAt: '2026-09-18T20:10:00.000Z',
      };

      expect(donationWebhookPayloadSchema.safeParse(payload).success).toBe(true);
    });

    it('validates minimal webhook payload', () => {
      const payload = {
        event: 'payment.failed',
        status: 'FAILED',
      };

      expect(donationWebhookPayloadSchema.safeParse(payload).success).toBe(true);
    });

    it('rejects webhook payload with invalid status', () => {
      const payload = {
        event: 'payment.unknown',
        status: 'UNKNOWN_STATUS',
      };

      expect(donationWebhookPayloadSchema.safeParse(payload).success).toBe(false);
    });
  });
});
