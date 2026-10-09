import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminFeedbackListResponseDto,
  AdminFeedbackResponseDto,
  ApproveFeedbackOutput,
  CreateFeedbackOutput,
  ListAdminFeedbackQueryDto,
  RejectFeedbackDto,
  SubmitterFeedbackResponseDto,
} from '@aletheia/contracts';
import type { FeedbackSubmission } from '@prisma/client';
import { FeedbackRepository } from '../infrastructure/feedback.repository.js';
import {
  GITHUB_ISSUE_GATEWAY,
  type GithubIssueGateway,
} from '../infrastructure/github-issue.gateway.interface.js';
import {
  buildIssueBody,
  FEEDBACK_CATEGORY_LABELS,
} from '../infrastructure/github-issue-body.js';
import {
  SETTINGS_PUBLIC_API,
  type SettingsPublicApi,
} from '../../settings/application/public-api.js';
import {
  FAMILY_PUBLIC_API,
  type FamilyPublicApi,
} from '../../families/application/public-api.js';
import {
  IDENTITY_PUBLIC_API,
  type IdentityPublicApi,
} from '../../identity/application/public-api.js';
import {
  PRIVACY_PUBLIC_API,
  type PrivacyPublicApi,
} from '../../privacy/application/public-api.js';

export const GUARDIAN_ROLES = ['OWNER_GUARDIAN', 'GUARDIAN', 'CO_GUARDIAN'] as const;
const reviewLocks = new Map<string, Promise<void>>();

@Injectable()
export class FeedbackService {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    @Inject(GITHUB_ISSUE_GATEWAY)
    private readonly githubGateway: GithubIssueGateway,
    @Inject(SETTINGS_PUBLIC_API)
    private readonly settingsApi: SettingsPublicApi,
    @Inject(FAMILY_PUBLIC_API)
    private readonly familyApi: FamilyPublicApi,
    @Inject(IDENTITY_PUBLIC_API)
    private readonly identityApi: IdentityPublicApi,
    @Inject(PRIVACY_PUBLIC_API)
    private readonly privacyApi: PrivacyPublicApi,
  ) {}

  async create(
    familyId: string,
    userId: string,
    dto: CreateFeedbackOutput,
  ): Promise<SubmitterFeedbackResponseDto> {
    const role = await this.familyApi.getFamilyMemberRole(userId, familyId);
    if (
      !role ||
      !(GUARDIAN_ROLES as readonly string[]).includes(role)
    ) {
      throw new ForbiddenException('Only family guardians can send feedback.');
    }

    let submitterName: string | null = null;
    let submitterEmail: string | null = null;

    if (dto.identifySelf) {
      const user = await this.identityApi.findUserById(userId);
      if (!user) {
        throw new NotFoundException('Authenticated user not found.');
      }
      submitterName = user.fullName;
      submitterEmail = user.email;
    }

    const created = await this.feedbackRepository.create({
      familyId,
      submittedByUserId: userId,
      category: dto.category,
      message: dto.message,
      pagePath: dto.pagePath ?? null,
      locale: dto.locale ?? null,
      appVersion: dto.appVersion ?? null,
      userAgent: dto.userAgent ?? null,
      identifySelf: dto.identifySelf,
      submitterName,
      submitterEmail,
    });

    return {
      id: created.id,
      status: 'PENDING',
      category: created.category,
      identifySelf: created.identifySelf,
      createdAt: created.createdAt.toISOString(),
    };
  }

  async list(
    query: ListAdminFeedbackQueryDto,
    actorUserId: string,
  ): Promise<AdminFeedbackListResponseDto> {
    const result = await this.feedbackRepository.list({
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    });

    for (const item of result.items) {
      await this.privacyApi.recordSensitiveDataAccess({
        actorUserId,
        familyId: item.familyId,
        action: 'READ',
        resourceType: 'FEEDBACK_SUBMISSION',
        resourceId: item.id,
      });
    }

    return {
      items: result.items.map((item) => this.toAdminDto(item)),
      total: result.total,
    };
  }

  async getById(id: string, actorUserId: string): Promise<AdminFeedbackResponseDto> {
    const submission = await this.feedbackRepository.findById(id);
    if (!submission) {
      throw new NotFoundException('Feedback submission not found.');
    }

    await this.privacyApi.recordSensitiveDataAccess({
      actorUserId,
      familyId: submission.familyId,
      action: 'READ',
      resourceType: 'FEEDBACK_SUBMISSION',
      resourceId: id,
    });

    return this.toAdminDto(submission);
  }

  async approve(
    id: string,
    actorUserId: string,
    dto: ApproveFeedbackOutput,
  ): Promise<AdminFeedbackResponseDto> {
    return this.withReviewLock(id, async () => {
      const submission = await this.requirePending(id);

    const marker = submission.id;
    let issue: { number: number; url: string };
    try {
      const existing = submission.githubIssueNumber !== null && submission.githubIssueUrl
        ? { number: submission.githubIssueNumber, url: submission.githubIssueUrl }
        : await this.githubGateway.findIssueByMarker(marker);
      if (existing) {
        issue = existing;
      } else {
        const labels = Array.from(
          new Set([
            'feedback',
            FEEDBACK_CATEGORY_LABELS[submission.category],
            ...dto.labels,
          ]),
        );
        issue = await this.githubGateway.createIssue({
          title: dto.title,
          body: buildIssueBody({
            feedbackId: submission.id,
            category: submission.category,
            createdAt: submission.createdAt.toISOString(),
            locale: submission.locale,
            pagePath: submission.pagePath,
            appVersion: submission.appVersion,
            message: submission.message,
            adminNote: dto.adminNote ?? null,
            identifySelf: submission.identifySelf,
            submitterName: submission.submitterName,
            submitterEmail: submission.submitterEmail,
          }),
          labels,
        });
      }
    } catch (error) {
      await this.feedbackRepository.recordIssueFailure(
        id,
        (error as Error).message,
      );
      throw new BadGatewayException(
        'Could not open the GitHub issue. The report is still pending.',
      );
    }

    const approved = await this.feedbackRepository.markApproved(id, {
      adminNote: dto.adminNote ?? null,
      reviewedByUserId: actorUserId,
      githubIssueNumber: issue.number,
      githubIssueUrl: issue.url,
    });

    try {
      await this.notifyFamily(
        submission.familyId,
        'FEEDBACK_APPROVED',
        'Seu feedback virou uma issue no GitHub',
        `O relato #${approved.githubIssueNumber} foi aberto.`,
        issue.url,
      );
    } catch (error) {
      await this.feedbackRepository.restorePending(id);
      throw error;
    }

      return this.toAdminDto(approved);
    });
  }

  async reject(
    id: string,
    actorUserId: string,
    dto: RejectFeedbackDto,
  ): Promise<AdminFeedbackResponseDto> {
    return this.withReviewLock(id, async () => {
      const submission = await this.requirePending(id);

    const rejected = await this.feedbackRepository.markRejected(id, {
      adminNote: dto.reason,
      reviewedByUserId: actorUserId,
    });

    try {
      await this.notifyFamily(
        submission.familyId,
        'FEEDBACK_REJECTED',
        'Seu feedback não foi aceito',
        `O relato foi rejeitado pelo motivo: ${dto.reason}`,
        null,
      );
    } catch (error) {
      await this.feedbackRepository.restorePending(id);
      throw error;
    }

      return this.toAdminDto(rejected);
    });
  }

  private async withReviewLock<T>(id: string, action: () => Promise<T>): Promise<T> {
    const previous = reviewLocks.get(id) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => { release = resolve; });
    reviewLocks.set(id, current);
    await previous;
    try { return await action(); } finally {
      release();
      if (reviewLocks.get(id) === current) reviewLocks.delete(id);
    }
  }

  private async requirePending(id: string): Promise<FeedbackSubmission> {
    const submission = await this.feedbackRepository.findById(id);
    if (!submission) {
      throw new NotFoundException('Feedback submission not found.');
    }
    if (submission.status !== 'PENDING') {
      throw new ConflictException('Feedback submission is no longer pending.');
    }
    return submission;
  }

  private async notifyFamily(
    familyId: string,
    type: 'FEEDBACK_APPROVED' | 'FEEDBACK_REJECTED',
    title: string,
    message: string,
    linkUrl: string | null,
  ): Promise<void> {
    const memberIds = await this.familyApi.getFamilyMemberUserIds(familyId);
    for (const userId of memberIds) {
      await this.settingsApi.createNotification(familyId, {
        userId,
        type,
        title,
        message,
        linkUrl,
      });
    }
  }

  private toAdminDto(row: FeedbackSubmission): AdminFeedbackResponseDto {
    return {
      id: row.id,
      familyId: row.familyId,
      category: row.category,
      message: row.message,
      status: row.status,
      identifySelf: row.identifySelf,
      submitterName: row.submitterName,
      submitterEmail: row.submitterEmail,
      pagePath: row.pagePath,
      locale: row.locale,
      appVersion: row.appVersion,
      adminNote: row.adminNote,
      lastIssueError: row.lastIssueError,
      githubIssueNumber: row.githubIssueNumber,
      githubIssueUrl: row.githubIssueUrl,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    };
  }
}
