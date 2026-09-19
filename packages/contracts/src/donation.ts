import { z } from 'zod';

export const donationFrequencySchema = z.enum(['ONE_TIME', 'MONTHLY']);
export type DonationFrequency = z.infer<typeof donationFrequencySchema>;

export const donationPaymentMethodSchema = z.enum(['PIX', 'GOOGLE_PAY', 'CREDIT_CARD']);
export type DonationPaymentMethod = z.infer<typeof donationPaymentMethodSchema>;

export const donationStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED']);
export type DonationStatus = z.infer<typeof donationStatusSchema>;

export const createDonationIntentSchema = z.object({
  amountCents: z.number().int().min(500, 'Valor mínimo de apoio é R$ 5,00'),
  frequency: donationFrequencySchema.default('ONE_TIME'),
  paymentMethod: donationPaymentMethodSchema.default('PIX'),
  donorName: z.string().min(2).max(150).optional(),
  donorEmail: z.string().email().optional(),
});

export type CreateDonationIntentDto = z.input<typeof createDonationIntentSchema>;
export type CreateDonationIntentOutput = z.output<typeof createDonationIntentSchema>;

export const donationIntentResponseSchema = z.object({
  donationId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.literal('BRL'),
  status: donationStatusSchema,
  paymentMethod: donationPaymentMethodSchema,
  frequency: donationFrequencySchema,
  pixQrCodeUrl: z.string().optional(),
  pixCopiaECola: z.string().optional(),
  gatewayClientSecret: z.string().optional(),
  expiresAt: z.string(),
  createdAt: z.string(),
});

export type DonationIntentResponseDto = z.infer<typeof donationIntentResponseSchema>;

export const donationRecordResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid().nullish(),
  donorName: z.string().nullish(),
  donorEmail: z.string().nullish(),
  amountCents: z.number().int(),
  currency: z.string(),
  frequency: donationFrequencySchema,
  paymentMethod: donationPaymentMethodSchema,
  status: donationStatusSchema,
  pixCopiaECola: z.string().nullish(),
  confirmedAt: z.string().nullish(),
  createdAt: z.string(),
});

export type DonationRecordResponseDto = z.infer<typeof donationRecordResponseSchema>;

export const supporterSubscriptionResponseSchema = z.object({
  id: z.string().uuid(),
  familyId: z.string().uuid(),
  amountCents: z.number().int(),
  currency: z.string(),
  paymentMethod: donationPaymentMethodSchema,
  status: donationStatusSchema,
  gatewaySubscriptionId: z.string(),
  cancelledAt: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SupporterSubscriptionResponseDto = z.infer<typeof supporterSubscriptionResponseSchema>;

export const donationWebhookPayloadSchema = z.object({
  event: z.string(),
  gatewayTransactionId: z.string().optional(),
  gatewaySubscriptionId: z.string().optional(),
  status: donationStatusSchema,
  amountCents: z.number().int().optional(),
  paidAt: z.string().optional(),
});

export type DonationWebhookPayloadDto = z.infer<typeof donationWebhookPayloadSchema>;
