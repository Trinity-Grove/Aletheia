import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DONATION_GATEWAY,
  type DonationGateway,
} from '../infrastructure/donation-gateway.interface.js';
import { DonationsRepository } from '../infrastructure/donations.repository.js';
import type {
  CreateDonationIntentDto,
  DonationIntentResponseDto,
  DonationRecordResponseDto,
  SupporterSubscriptionResponseDto,
} from '@aletheia/contracts';
import type { DonationRecord, SupporterSubscription } from '@prisma/client';

@Injectable()
export class DonationsService {
  private readonly gatewayProviderName: string;

  constructor(
    private readonly repository: DonationsRepository,
    @Inject(DONATION_GATEWAY) private readonly gateway: DonationGateway,
  ) {
    this.gatewayProviderName =
      process.env['DONATION_GATEWAY_PROVIDER'] ?? 'mock';
  }

  async createIntent(
    familyId: string,
    dto: CreateDonationIntentDto,
  ): Promise<DonationIntentResponseDto> {
    if (dto.amountCents < 500) {
      throw new BadRequestException('Valor mínimo de apoio é R$ 5,00');
    }

    const frequency = dto.frequency ?? 'ONE_TIME';
    const paymentMethod = dto.paymentMethod ?? 'PIX';

    if (frequency === 'MONTHLY') {
      const subscriptionId = randomUUID();

      const subIntent = await this.gateway.createSubscriptionIntent({
        subscriptionId,
        familyId,
        amountCents: dto.amountCents,
        paymentMethod,
        donorName: dto.donorName,
        donorEmail: dto.donorEmail,
      });

      await this.repository.createSupporterSubscription({
        id: subscriptionId,
        familyId,
        amountCents: dto.amountCents,
        currency: 'BRL',
        paymentMethod,
        status: 'PENDING',
        gatewayProvider: this.gatewayProviderName,
        gatewaySubscriptionId: subIntent.gatewaySubscriptionId,
      });

      const initialRecord = await this.repository.createDonationRecord({
        familyId,
        donorName: dto.donorName ?? null,
        donorEmail: dto.donorEmail ?? null,
        amountCents: dto.amountCents,
        currency: 'BRL',
        frequency: 'MONTHLY',
        paymentMethod,
        status: 'PENDING',
        gatewayProvider: this.gatewayProviderName,
        gatewaySubscriptionId: subIntent.gatewaySubscriptionId,
      });

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      return {
        donationId: initialRecord.id,
        amountCents: initialRecord.amountCents,
        currency: 'BRL',
        status: initialRecord.status,
        paymentMethod: initialRecord.paymentMethod,
        frequency: 'MONTHLY',
        ...(subIntent.clientSecret ? { gatewayClientSecret: subIntent.clientSecret } : {}),
        expiresAt,
        createdAt: initialRecord.createdAt.toISOString(),
      };
    }

    // ONE_TIME donation
    const record = await this.repository.createDonationRecord({
      familyId,
      donorName: dto.donorName ?? null,
      donorEmail: dto.donorEmail ?? null,
      amountCents: dto.amountCents,
      currency: 'BRL',
      frequency: 'ONE_TIME',
      paymentMethod,
      status: 'PENDING',
      gatewayProvider: this.gatewayProviderName,
    });

    const intent = await this.gateway.createOneTimeIntent({
      donationId: record.id,
      amountCents: record.amountCents,
      paymentMethod: record.paymentMethod,
      donorName: dto.donorName,
      donorEmail: dto.donorEmail,
    });

    await this.repository.updateDonationRecordGatewayData(record.id, {
      gatewayTransactionId: intent.gatewayTransactionId,
      pixQrCodeUrl: intent.pixQrCodeUrl ?? null,
      pixCopiaECola: intent.pixCopiaECola ?? null,
    });

    return {
      donationId: record.id,
      amountCents: record.amountCents,
      currency: 'BRL',
      status: 'PENDING',
      paymentMethod: record.paymentMethod,
      frequency: 'ONE_TIME',
      ...(intent.pixQrCodeUrl ? { pixQrCodeUrl: intent.pixQrCodeUrl } : {}),
      ...(intent.pixCopiaECola ? { pixCopiaECola: intent.pixCopiaECola } : {}),
      ...(intent.clientSecret ? { gatewayClientSecret: intent.clientSecret } : {}),
      expiresAt: intent.expiresAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
    };
  }

  async getStatus(
    familyId: string,
    donationId: string,
  ): Promise<DonationRecordResponseDto> {
    const record = await this.repository.findDonationRecordById(
      donationId,
      familyId,
    );

    if (!record) {
      throw new NotFoundException('Apoio não encontrado');
    }

    return this.mapDonationRecordToDto(record);
  }

  async getHistory(familyId: string): Promise<DonationRecordResponseDto[]> {
    const records = await this.repository.listDonationRecordsByFamilyId(familyId);
    return records.map((record) => this.mapDonationRecordToDto(record));
  }

  async getSubscriptions(
    familyId: string,
  ): Promise<SupporterSubscriptionResponseDto[]> {
    const subs = await this.repository.listSupporterSubscriptionsByFamilyId(
      familyId,
    );
    return subs.map((sub) => this.mapSubscriptionToDto(sub));
  }

  async cancelSubscription(
    familyId: string,
    subscriptionId: string,
  ): Promise<SupporterSubscriptionResponseDto> {
    const sub = await this.repository.findSupporterSubscriptionById(
      subscriptionId,
      familyId,
    );

    if (!sub) {
      throw new NotFoundException('Assinatura de apoio não encontrada');
    }

    await this.gateway.cancelSubscription(sub.gatewaySubscriptionId);

    const updated = await this.repository.updateSupporterSubscriptionStatus(
      sub.id,
      'CANCELLED',
      new Date(),
    );

    return this.mapSubscriptionToDto(updated);
  }

  async handleWebhook(
    provider: string,
    payload: unknown,
    signatureHeader?: string | string[],
  ): Promise<{ received: boolean; idempotent?: boolean; handled?: boolean }> {
    const headers: Record<string, string | string[] | undefined> = {
      'x-signature': signatureHeader,
    };

    const event = await this.gateway.parseWebhook(payload, headers);

    if (event.gatewayTransactionId) {
      const record =
        await this.repository.findDonationRecordByGatewayTransactionId(
          event.gatewayTransactionId,
        );

      if (!record) {
        return { received: true, handled: false };
      }

      if (record.status === 'CONFIRMED' && event.status === 'CONFIRMED') {
        return { received: true, idempotent: true };
      }

      const confirmedAt =
        event.paidAt ?? (event.status === 'CONFIRMED' ? new Date() : null);

      await this.repository.updateDonationRecordStatus(
        record.id,
        event.status,
        confirmedAt,
      );

      return { received: true };
    }

    if (event.gatewaySubscriptionId) {
      const sub =
        await this.repository.findSupporterSubscriptionByGatewayId(
          event.gatewaySubscriptionId,
        );

      if (!sub) {
        return { received: true, handled: false };
      }

      if (sub.status === event.status) {
        return { received: true, idempotent: true };
      }

      const cancelledAt = event.status === 'CANCELLED' ? new Date() : null;

      await this.repository.updateSupporterSubscriptionStatus(
        sub.id,
        event.status,
        cancelledAt,
      );

      return { received: true };
    }

    return { received: true, handled: false };
  }

  private mapDonationRecordToDto(
    record: DonationRecord,
  ): DonationRecordResponseDto {
    return {
      id: record.id,
      familyId: record.familyId,
      donorName: record.donorName,
      donorEmail: record.donorEmail,
      amountCents: record.amountCents,
      currency: record.currency,
      frequency: record.frequency,
      paymentMethod: record.paymentMethod,
      status: record.status,
      pixCopiaECola: record.pixCopiaECola,
      confirmedAt: record.confirmedAt ? record.confirmedAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private mapSubscriptionToDto(
    sub: SupporterSubscription,
  ): SupporterSubscriptionResponseDto {
    return {
      id: sub.id,
      familyId: sub.familyId,
      amountCents: sub.amountCents,
      currency: sub.currency,
      paymentMethod: sub.paymentMethod,
      status: sub.status,
      gatewaySubscriptionId: sub.gatewaySubscriptionId,
      cancelledAt: sub.cancelledAt ? sub.cancelledAt.toISOString() : null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    };
  }
}
