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
  // Card-based one-time donations with no client-side tokenization use a
  // hosted checkout redirect too (same shape as the subscription flow's
  // authorizationUrl below).
  authorizationUrl?: string | undefined;
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
  // Mercado Pago's "pending payments" preapproval flow (no card_token_id
  // collected up front) returns a hosted checkout link -- the payer
  // completes card entry there themselves. Real gateways with no
  // redirect-based flow simply omit this.
  authorizationUrl?: string | undefined;
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
  // Set only for classic `payment` topic events (Checkout Pro one-time
  // card donations): the record was created with a preference id as a
  // placeholder gatewayTransactionId, since the real payment id doesn't
  // exist until the payer completes checkout on Mercado Pago's hosted
  // page. The first webhook links back via this (the donationId we sent
  // as `external_reference`) instead of gatewayTransactionId.
  externalReference?: string | undefined;
}

export interface DonationGateway {
  createOneTimeIntent(params: CreateOneTimeIntentParams): Promise<CreateOneTimeIntentResult>;
  createSubscriptionIntent(params: CreateSubscriptionIntentParams): Promise<CreateSubscriptionIntentResult>;
  cancelSubscription(gatewaySubscriptionId: string): Promise<void>;
  // `query` carries the webhook URL's query-string params (Mercado Pago's
  // `data.id`/`type`) -- the real gateway's HMAC signature manifest needs
  // `data.id` from here specifically, never from the JSON body, per its
  // notification docs.
  parseWebhook(
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
    query?: Record<string, string | undefined>,
  ): Promise<WebhookEventResult>;
}

export const DONATION_GATEWAY = Symbol('DONATION_GATEWAY');
