import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type {
  DonationFrequency,
  DonationPaymentMethod,
  DonationStatus,
} from '@aletheia/contracts';
import type { DonationRecord, SupporterSubscription } from '@prisma/client';

export interface CreateDonationRecordData {
  id?: string | undefined;
  familyId?: string | null | undefined;
  donorName?: string | null | undefined;
  donorEmail?: string | null | undefined;
  amountCents: number;
  currency?: string | undefined;
  frequency?: DonationFrequency | undefined;
  paymentMethod: DonationPaymentMethod;
  status?: DonationStatus | undefined;
  gatewayProvider: string;
  gatewayTransactionId?: string | null | undefined;
  gatewaySubscriptionId?: string | null | undefined;
  pixQrCodeUrl?: string | null | undefined;
  pixCopiaECola?: string | null | undefined;
  notes?: string | null | undefined;
  confirmedAt?: Date | null | undefined;
}

export interface UpdateDonationGatewayData {
  gatewayTransactionId?: string | null | undefined;
  pixQrCodeUrl?: string | null | undefined;
  pixCopiaECola?: string | null | undefined;
}

export interface CreateSupporterSubscriptionData {
  id?: string | undefined;
  familyId: string;
  amountCents: number;
  currency?: string | undefined;
  paymentMethod: DonationPaymentMethod;
  status?: DonationStatus | undefined;
  gatewayProvider: string;
  gatewaySubscriptionId: string;
}

@Injectable()
export class DonationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createDonationRecord(data: CreateDonationRecordData): Promise<DonationRecord> {
    return this.prisma.donationRecord.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        familyId: data.familyId ?? null,
        donorName: data.donorName ?? null,
        donorEmail: data.donorEmail ?? null,
        amountCents: data.amountCents,
        currency: data.currency ?? 'BRL',
        frequency: data.frequency ?? 'ONE_TIME',
        paymentMethod: data.paymentMethod,
        status: data.status ?? 'PENDING',
        gatewayProvider: data.gatewayProvider,
        gatewayTransactionId: data.gatewayTransactionId ?? null,
        gatewaySubscriptionId: data.gatewaySubscriptionId ?? null,
        pixQrCodeUrl: data.pixQrCodeUrl ?? null,
        pixCopiaECola: data.pixCopiaECola ?? null,
        notes: data.notes ?? null,
        confirmedAt: data.confirmedAt ?? null,
      },
    });
  }

  async findDonationRecordById(
    id: string,
    familyId?: string,
  ): Promise<DonationRecord | null> {
    if (familyId) {
      return this.prisma.donationRecord.findFirst({
        where: { id, familyId },
      });
    }
    return this.prisma.donationRecord.findUnique({
      where: { id },
    });
  }

  async findDonationRecordByGatewayTransactionId(
    gatewayTransactionId: string,
  ): Promise<DonationRecord | null> {
    return this.prisma.donationRecord.findFirst({
      where: { gatewayTransactionId },
    });
  }

  async updateDonationRecordStatus(
    id: string,
    status: DonationStatus,
    confirmedAt?: Date | null,
  ): Promise<DonationRecord> {
    return this.prisma.donationRecord.update({
      where: { id },
      data: {
        status,
        ...(confirmedAt !== undefined ? { confirmedAt } : {}),
      },
    });
  }

  async updateDonationRecordGatewayData(
    id: string,
    data: UpdateDonationGatewayData,
  ): Promise<DonationRecord> {
    return this.prisma.donationRecord.update({
      where: { id },
      data: {
        ...(data.gatewayTransactionId !== undefined
          ? { gatewayTransactionId: data.gatewayTransactionId }
          : {}),
        ...(data.pixQrCodeUrl !== undefined ? { pixQrCodeUrl: data.pixQrCodeUrl } : {}),
        ...(data.pixCopiaECola !== undefined
          ? { pixCopiaECola: data.pixCopiaECola }
          : {}),
      },
    });
  }

  async listDonationRecordsByFamilyId(familyId: string): Promise<DonationRecord[]> {
    return this.prisma.donationRecord.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSupporterSubscription(
    data: CreateSupporterSubscriptionData,
  ): Promise<SupporterSubscription> {
    return this.prisma.supporterSubscription.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        familyId: data.familyId,
        amountCents: data.amountCents,
        currency: data.currency ?? 'BRL',
        paymentMethod: data.paymentMethod,
        status: data.status ?? 'PENDING',
        gatewayProvider: data.gatewayProvider,
        gatewaySubscriptionId: data.gatewaySubscriptionId,
      },
    });
  }

  async findSupporterSubscriptionById(
    id: string,
    familyId: string,
  ): Promise<SupporterSubscription | null> {
    return this.prisma.supporterSubscription.findFirst({
      where: { id, familyId },
    });
  }

  async findSupporterSubscriptionByGatewayId(
    gatewaySubscriptionId: string,
  ): Promise<SupporterSubscription | null> {
    return this.prisma.supporterSubscription.findUnique({
      where: { gatewaySubscriptionId },
    });
  }

  async listSupporterSubscriptionsByFamilyId(
    familyId: string,
  ): Promise<SupporterSubscription[]> {
    return this.prisma.supporterSubscription.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateSupporterSubscriptionStatus(
    id: string,
    status: DonationStatus,
    cancelledAt?: Date | null,
  ): Promise<SupporterSubscription> {
    return this.prisma.supporterSubscription.update({
      where: { id },
      data: {
        status,
        ...(cancelledAt !== undefined ? { cancelledAt } : {}),
      },
    });
  }
}
