import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  FeedbackService,
  GUARDIAN_ROLES,
} from './feedback.service.js';
import type { FeedbackRepository } from '../infrastructure/feedback.repository.js';
import type {
  GithubIssueGateway,
  GITHUB_ISSUE_GATEWAY,
} from '../infrastructure/github-issue.gateway.interface.js';
import {
  FEEDBACK_CATEGORY_LABELS,
  buildFeedbackMarker,
} from '../infrastructure/github-issue-body.js';
import { SETTINGS_PUBLIC_API, type SettingsPublicApi } from '../../settings/application/public-api.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../../families/application/public-api.js';
import { IDENTITY_PUBLIC_API, type IdentityPublicApi } from '../../identity/application/public-api.js';
import { PRIVACY_PUBLIC_API, type PrivacyPublicApi } from '../../privacy/application/public-api.js';
import type { UserSummaryDto } from '@aletheia/contracts';
import type {
  FeedbackCategory,
  FeedbackStatus,
  FeedbackSubmission,
} from '@prisma/client';

describe('FeedbackService', () => {
  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const USER_ID = '22222222-2222-4222-8222-222222222222';
  const ADMIN_ID = '33333333-3333-4333-8333-333333333333';
  const FEEDBACK_ID = '44444444-4444-4444-8444-444444444444';

  let service: FeedbackService;
  let repository: jest.Mocked<FeedbackRepository>;
  let githubGateway: jest.Mocked<GithubIssueGateway>;
  let settingsApi: jest.Mocked<SettingsPublicApi>;
  let familyApi: jest.Mocked<FamilyPublicApi>;
  let identityApi: jest.Mocked<IdentityPublicApi>;
  let privacyApi: jest.Mocked<PrivacyPublicApi>;

  const baseRow: FeedbackSubmission = {
    id: FEEDBACK_ID,
    familyId: FAMILY_ID,
    submittedByUserId: USER_ID,
    category: 'BUG',
    message: 'O botão de salvar trava às vezes.',
    pagePath: '/curriculum/packs',
    locale: 'pt-BR',
    appVersion: '1.2.3',
    userAgent: 'Mozilla/5.0',
    identifySelf: false,
    submitterName: null,
    submitterEmail: null,
    status: 'PENDING',
    adminNote: null,
    lastIssueError: null,
    githubIssueNumber: null,
    githubIssueUrl: null,
    reviewedByUserId: null,
    reviewedAt: null,
    createdAt: new Date('2026-10-04T12:00:00.000Z'),
    updatedAt: new Date('2026-10-04T12:00:00.000Z'),
  } as unknown as FeedbackSubmission;

  const pendingRow: FeedbackSubmission = { ...baseRow };

  const approvedRow: FeedbackSubmission = {
    ...baseRow,
    status: 'APPROVED',
    adminNote: null,
    reviewedByUserId: ADMIN_ID,
    reviewedAt: new Date('2026-10-04T13:00:00.000Z'),
    githubIssueNumber: 322,
    githubIssueUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/322',
    lastIssueError: null,
  } as unknown as FeedbackSubmission;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue({ ...baseRow, identifySelf: false }),
      findById: jest.fn().mockResolvedValue(pendingRow),
      list: jest.fn().mockResolvedValue({ items: [pendingRow], total: 1 }),
      markApproved: jest.fn().mockResolvedValue(approvedRow),
      markRejected: jest.fn().mockResolvedValue({
        ...baseRow,
        status: 'REJECTED',
        adminNote: 'Fora do escopo',
        reviewedByUserId: ADMIN_ID,
        reviewedAt: new Date('2026-10-04T13:00:00.000Z'),
      } as unknown as FeedbackSubmission),
      recordIssueFailure: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<FeedbackRepository>;

    githubGateway = {
      createIssue: jest.fn().mockResolvedValue({
        number: 322,
        url: 'https://github.com/Trinity-Grove/Aletheia/issues/322',
      }),
      findIssueByMarker: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<GithubIssueGateway>;

    settingsApi = {
      getSettings: jest.fn(),
      createNotification: jest.fn().mockResolvedValue(null),
      wasNotifiedSince: jest.fn(),
      listFamiliesWithRemindersEnabled: jest.fn(),
      exportFamilyData: jest.fn(),
    } as unknown as jest.Mocked<SettingsPublicApi>;

    familyApi = {
      isGuardianInFamily: jest.fn(),
      getFamilyForUser: jest.fn(),
      getFamilyMemberUserIds: jest.fn().mockResolvedValue([USER_ID]),
      getFamilyMemberRole: jest.fn().mockResolvedValue('GUARDIAN'),
    } as unknown as jest.Mocked<FamilyPublicApi>;

    identityApi = {
      verifyToken: jest.fn(),
      findUserById: jest.fn().mockResolvedValue({
        fullName: 'Ana Souza',
        email: 'ana@example.com',
      } as UserSummaryDto),
      isPlatformAdmin: jest.fn(),
    } as unknown as jest.Mocked<IdentityPublicApi>;

    privacyApi = {
      checkMandatoryCompliance: jest.fn(),
      getPublishedDefinitions: jest.fn(),
      grantConsent: jest.fn(),
      recordSensitiveDataAccess: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PrivacyPublicApi>;

    service = new FeedbackService(
      repository,
      githubGateway,
      settingsApi,
      familyApi,
      identityApi,
      privacyApi,
    );
  });

  it('stores only submittedByUserId when identifySelf is false -- no name, no email duplicated', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('GUARDIAN');
    identityApi.findUserById.mockResolvedValue({
      fullName: 'Ana Souza',
      email: 'ana@example.com',
    } as UserSummaryDto);

    await service.create(FAMILY_ID, USER_ID, {
      category: 'BUG',
      message: 'O botão de salvar trava às vezes.',
      identifySelf: false,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        identifySelf: false,
        submitterName: null,
        submitterEmail: null,
      }),
    );
    expect(identityApi.findUserById).not.toHaveBeenCalled();
  });

  it('freezes the submitter snapshot when identifySelf is true', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('CO_GUARDIAN');
    identityApi.findUserById.mockResolvedValue({
      fullName: 'Ana Souza',
      email: 'ana@example.com',
    } as UserSummaryDto);

    await service.create(FAMILY_ID, USER_ID, {
      category: 'IDEA',
      message: 'Seria ótimo um modo escuro no app.',
      identifySelf: true,
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        identifySelf: true,
        submitterName: 'Ana Souza',
        submitterEmail: 'ana@example.com',
      }),
    );
  });

  it('rejects an EDUCATOR even though FamilyTenantGuard let the request through', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('EDUCATOR');
    await expect(
      service.create(FAMILY_ID, USER_ID, {
        category: 'BUG',
        message: 'O botão de salvar trava às vezes.',
        identifySelf: false,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('throws NotFound when identifySelf is true but the account cannot be read', async () => {
    familyApi.getFamilyMemberRole.mockResolvedValue('OWNER_GUARDIAN');
    identityApi.findUserById.mockResolvedValue(null);
    await expect(
      service.create(FAMILY_ID, USER_ID, {
        category: 'BUG',
        message: 'O botão de salvar trava às vezes.',
        identifySelf: true,
      }),
    ).rejects.toThrow(NotFoundException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('never sends a notification while the submission is PENDING', async () => {
    repository.findById.mockResolvedValue(pendingRow);
    githubGateway.findIssueByMarker.mockRejectedValue(
      new Error('GitHub 503: Service Unavailable'),
    );

    await expect(
      service.approve(FEEDBACK_ID, ADMIN_ID, {
        title: 'Botão de salvar trava',
        labels: [],
        adminNote: undefined,
      }),
    ).rejects.toThrow(BadGatewayException);

    expect(repository.markApproved).not.toHaveBeenCalled();
    expect(repository.recordIssueFailure).toHaveBeenCalledWith(
      FEEDBACK_ID,
      expect.stringContaining('GitHub 503'),
    );
    expect(settingsApi.createNotification).not.toHaveBeenCalled();
  });

  it('reuses the existing issue on retry instead of opening a second one', async () => {
    repository.findById.mockResolvedValue({
      ...pendingRow,
      githubIssueNumber: 321,
      githubIssueUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/321',
    });
    githubGateway.findIssueByMarker.mockResolvedValue({
      number: 321,
      url: 'https://github.com/Trinity-Grove/Aletheia/issues/321',
    });

    await service.approve(FEEDBACK_ID, ADMIN_ID, {
      title: 'Botão de salvar trava',
      labels: [],
      adminNote: undefined,
    });

    expect(githubGateway.createIssue).not.toHaveBeenCalled();
    expect(repository.markApproved).toHaveBeenCalledWith(
      FEEDBACK_ID,
      expect.objectContaining({
        githubIssueNumber: 321,
        githubIssueUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/321',
      }),
    );
  });

  it('always adds the feedback and category labels, deduped, whatever the admin sends', async () => {
    repository.findById.mockResolvedValue(pendingRow);
    githubGateway.findIssueByMarker.mockResolvedValue(null);
    githubGateway.createIssue.mockResolvedValue({
      number: 322,
      url: 'https://github.com/Trinity-Grove/Aletheia/issues/322',
    });

    await service.approve(FEEDBACK_ID, ADMIN_ID, {
      title: 'Botão de salvar trava',
      labels: ['bug', 'ui'],
      adminNote: undefined,
    });

    expect(githubGateway.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ labels: ['feedback', 'bug', 'ui'] }),
    );
  });

  it('records APPROVED only after the issue exists', async () => {
    const order: string[] = [];
    githubGateway.createIssue.mockImplementation(async () => {
      order.push('github');
      return {
        number: 322,
        url: 'https://github.com/Trinity-Grove/Aletheia/issues/322',
      };
    });
    repository.markApproved.mockImplementation(async () => {
      order.push('db');
      return approvedRow;
    });

    await service.approve(FEEDBACK_ID, ADMIN_ID, {
      title: 'Botão de salvar trava',
      labels: [],
      adminNote: undefined,
    });

    expect(order).toEqual(['github', 'db']);
  });

  it('notifies every member of the family with the issue link on approval', async () => {
    familyApi.getFamilyMemberUserIds.mockResolvedValue([USER_ID, 'co-guardian-1']);
    settingsApi.createNotification.mockResolvedValue(null);

    await service.approve(FEEDBACK_ID, ADMIN_ID, {
      title: 'Botão de salvar trava',
      labels: [],
      adminNote: undefined,
    });

    expect(settingsApi.createNotification).toHaveBeenCalledTimes(2);
    expect(settingsApi.createNotification).toHaveBeenCalledWith(
      FAMILY_ID,
      expect.objectContaining({
        userId: 'co-guardian-1',
        type: 'FEEDBACK_APPROVED',
        linkUrl: 'https://github.com/Trinity-Grove/Aletheia/issues/322',
      }),
    );
  });

  it('notifies the family with the rejection reason', async () => {
    familyApi.getFamilyMemberUserIds.mockResolvedValue([USER_ID]);

    await service.reject(FEEDBACK_ID, ADMIN_ID, {
      reason: 'Fora do escopo do Aletheia',
    });

    expect(settingsApi.createNotification).toHaveBeenCalledWith(
      FAMILY_ID,
      expect.objectContaining({
        type: 'FEEDBACK_REJECTED',
        message: expect.stringContaining('Fora do escopo do Aletheia'),
      }),
    );
  });

  it('refuses to approve or reject a submission that is no longer PENDING', async () => {
    repository.findById.mockResolvedValue({ ...pendingRow, status: 'APPROVED' });
    await expect(
      service.approve(FEEDBACK_ID, ADMIN_ID, {
        title: 'Botão de salvar trava',
        labels: [],
        adminNote: undefined,
      }),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.reject(FEEDBACK_ID, ADMIN_ID, { reason: 'Fora do escopo' }),
    ).rejects.toThrow(ConflictException);
  });

  it('logs admin reads of the free-text message as sensitive data access', async () => {
    repository.findById.mockResolvedValue(pendingRow);

    await service.getById(FEEDBACK_ID, ADMIN_ID);

    expect(privacyApi.recordSensitiveDataAccess).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: ADMIN_ID,
        familyId: FAMILY_ID,
        action: 'READ',
        resourceType: 'FEEDBACK_SUBMISSION',
        resourceId: FEEDBACK_ID,
      }),
    );
  });
});
