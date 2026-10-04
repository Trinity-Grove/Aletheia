import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type AiFeatureType, type AiSuggestion, type AiSuggestionStatus } from '@prisma/client';
import { PrismaService } from '../../../platform/database/prisma.service.js';

export interface CreateAiSuggestionData {
  familyId: string;
  learnerId?: string | null;
  actorUserId: string;
  featureType?: AiFeatureType;
  sanitizedPrompt: string;
  rawModelOutput: Prisma.InputJsonValue;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costMicrosUsd?: number;
}

export interface UpdateAiSuggestionStatusData {
  status: AiSuggestionStatus;
  finalHumanOutput?: Prisma.InputJsonValue | null;
  createdEntityId?: string | null;
  rejectionReason?: string | null;
  reviewedAt?: Date | null;
}

@Injectable()
export class AiSuggestionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAiSuggestionData): Promise<AiSuggestion> {
    return this.prisma.aiSuggestion.create({
      data: {
        familyId: data.familyId,
        learnerId: data.learnerId ?? null,
        actorUserId: data.actorUserId,
        featureType: data.featureType ?? 'LESSON_PLAN_DRAFT',
        status: 'PENDING_REVIEW',
        sanitizedPrompt: data.sanitizedPrompt,
        rawModelOutput: data.rawModelOutput,
        provider: data.provider,
        model: data.model,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        costMicrosUsd: data.costMicrosUsd ?? 0,
      },
    });
  }

  async findById(familyId: string, id: string): Promise<AiSuggestion | null> {
    return this.prisma.aiSuggestion.findFirst({
      where: {
        id,
        familyId,
      },
    });
  }

  async updateStatus(
    familyId: string,
    id: string,
    data: UpdateAiSuggestionStatusData,
  ): Promise<AiSuggestion> {
    const existing = await this.prisma.aiSuggestion.findFirst({
      where: { id, familyId },
    });
    if (!existing) {
      throw new NotFoundException(`Suggestion not found: ${id}`);
    }

    return this.prisma.aiSuggestion.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.finalHumanOutput !== undefined
          ? { finalHumanOutput: data.finalHumanOutput ?? Prisma.JsonNull }
          : {}),
        ...(data.createdEntityId !== undefined ? { createdEntityId: data.createdEntityId } : {}),
        ...(data.rejectionReason !== undefined ? { rejectionReason: data.rejectionReason } : {}),
        reviewedAt: data.reviewedAt ?? new Date(),
      },
    });
  }

  async listByFamily(familyId: string, learnerId?: string): Promise<AiSuggestion[]> {
    return this.prisma.aiSuggestion.findMany({
      where: {
        familyId,
        ...(learnerId ? { learnerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
