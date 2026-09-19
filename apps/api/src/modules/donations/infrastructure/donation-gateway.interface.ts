import { DonationPaymentMethod } from '@aletheia/contracts';

export interface CreateOneTimeIntentParams {
  donationId: string;
  amountCents: number;
  paymentMethod: DonationPaymentMethod;
  donorName?: string | undefined;
  donorEmail?: string | undefined;
}

export interface CreateOneTimeIntentResult {
  gatewayTransactionId: string;
  pixQrCodeUrl?: string | undefined;
  pixCopiaECola?: string | undefined;
  clientSecret?: string | undefined;
  expiresAt: Date;
}

export interface CreateSubscriptionIntentParams {
  subscriptionId: string;
  familyId: string;
  amountCents: number;
  paymentMethod: DonationPaymentMethod;
  donorName?: string | undefined;
  donorEmail?: string | undefined;
}

export interface CreateSubscriptionIntentResult {
  gatewaySubscriptionId: string;
  clientSecret?: string | undefined;
  nextBillingAt?: Date | undefined;
}

export interface WebhookEventResult {
  eventId: string;
  eventType: string;
  gatewayTransactionId?: string | undefined;
  gatewaySubscriptionId?: string | undefined;
  status: 'CONFIRMED' | 'FAILED' | 'CANCELLED';
  amountCents?: number | undefined;
  paidAt?: Date | undefined;
}

export interface DonationGateway {
  createOneTimeIntent(params: CreateOneTimeIntentParams): Promise<CreateOneTimeIntentResult>;
  createSubscriptionIntent(params: CreateSubscriptionIntentParams): Promise<CreateSubscriptionIntentResult>;
  cancelSubscription(gatewaySubscriptionId: string): Promise<void>;
  parseWebhook(
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<WebhookEventResult>;
}

export const DONATION_GATEWAY = Symbol('DONATION_GATEWAY');
