import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/database/prisma.service.js';
import type {
  FeedbackCategory,
  FeedbackStatus,
  FeedbackSubmission,
} from '@prisma/client';

export interface CreateFeedbackData {
  familyId: string;
  submittedByUserId: string;
  category: FeedbackCategory;
  message: string;
  pagePath?: string | null;
  locale?: string | null;
  appVersion?: string | null;
  userAgent?: string | null;
  identifySelf?: boolean;
  submitterName?: string | null;
  submitterEmail?: string | null;
}

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFeedbackData): Promise<FeedbackSubmission> {
    return this.prisma.feedbackSubmission.create({
      data: {
        familyId: data.familyId,
        submittedByUserId: data.submittedByUserId,
        category: data.category,
        message: data.message,
        pagePath: data.pagePath ?? null,
        locale: data.locale ?? null,
        appVersion: data.appVersion ?? null,
        userAgent: data.userAgent ?? null,
        identifySelf: data.identifySelf ?? false,
        submitterName: data.identifySelf ? data.submitterName ?? null : null,
        submitterEmail: data.identifySelf ? data.submitterEmail ?? null : null,
      },
    });
  }

  async findById(id: string): Promise<FeedbackSubmission | null> {
    return this.prisma.feedbackSubmission.findUnique({
      where: { id },
    });
  }

  async list(query: {
    status?: FeedbackStatus;
    category?: FeedbackCategory;
    take: number;
    skip: number;
  }): Promise<{ items: FeedbackSubmission[]; total: number }> {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.category) {
      where.category = query.category;
    }

    const [items, total] = await Promise.all([
      this.prisma.feedbackSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.take,
        skip: query.skip,
      }),
      this.prisma.feedbackSubmission.count({ where }),
    ]);

    return { items, total };
  }

  async markApproved(
    id: string,
    data: {
      adminNote: string | null;
      reviewedByUserId: string;
      githubIssueNumber: number;
      githubIssueUrl: string;
    },
  ): Promise<FeedbackSubmission> {
    return this.prisma.feedbackSubmission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminNote: data.adminNote,
        reviewedByUserId: data.reviewedByUserId,
        reviewedAt: new Date(),
        githubIssueNumber: data.githubIssueNumber,
        githubIssueUrl: data.githubIssueUrl,
        lastIssueError: null,
      },
    });
  }

  async markRejected(
    id: string,
    data: { adminNote: string; reviewedByUserId: string },
  ): Promise<FeedbackSubmission> {
    return this.prisma.feedbackSubmission.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote: data.adminNote,
        reviewedByUserId: data.reviewedByUserId,
        reviewedAt: new Date(),
      },
    });
  }

  async recordIssueFailure(id: string, lastIssueError: string): Promise<void> {
    await this.prisma.feedbackSubmission.update({
      where: { id },
      data: {
        lastIssueError,
      },
    });
  }
}
