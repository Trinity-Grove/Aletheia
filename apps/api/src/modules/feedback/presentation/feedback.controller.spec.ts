import { BadGatewayException } from '@nestjs/common';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackAdminController } from './feedback-admin.controller.js';
import type { FeedbackService } from '../application/feedback.service.js';
import type {
  AdminFeedbackResponseDto,
  ApproveFeedbackDto,
  CreateFeedbackDto,
  RejectFeedbackDto,
} from '@aletheia/contracts';

describe('FeedbackController & FeedbackAdminController', () => {
  const FAMILY_ID = '11111111-1111-4111-8111-111111111111';
  const USER_ID = '44444444-4444-4444-8444-444444444444';
  const FEEDBACK_ID = '22222222-2222-4222-8222-222222222222';

  let feedbackController: FeedbackController;
  let adminController: FeedbackAdminController;
  let mockService: jest.Mocked<FeedbackService>;

  beforeEach(() => {
    mockService = {
      create: jest.fn(),
      list: jest.fn(),
      getById: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
    } as unknown as jest.Mocked<FeedbackService>;

    feedbackController = new FeedbackController(mockService);
    adminController = new FeedbackAdminController(mockService);
  });

  describe('FeedbackController', () => {
    describe('POST /families/:familyId/feedback', () => {
      it('delegates to FeedbackService.create with familyId, currentUserId and dto', async () => {
        const dto: CreateFeedbackDto = {
          category: 'IDEA',
          message: 'Adding a weekly support feedback widget would help.',
          identifySelf: true,
          pagePath: '/families/123/support',
          locale: 'pt-BR',
          appVersion: '1.0.0',
        };

        const expectedResponse = {
          id: FEEDBACK_ID,
          status: 'PENDING' as const,
          category: 'IDEA' as const,
          identifySelf: true,
          createdAt: new Date().toISOString(),
        };

        mockService.create.mockResolvedValue(expectedResponse);

        const result = await feedbackController.create(
          FAMILY_ID,
          USER_ID,
          dto as any,
        );

        expect(mockService.create).toHaveBeenCalledWith(FAMILY_ID, USER_ID, dto);
        expect(result).toEqual(expectedResponse);
      });
    });
  });

  describe('FeedbackAdminController', () => {
    describe('GET /admin/feedback', () => {
      it('delegates to FeedbackService.list with query and actorUserId', async () => {
        const query = { status: 'PENDING' as const, take: 50, skip: 0 };
        const expectedResponse = {
          items: [],
          total: 0,
        };

        mockService.list.mockResolvedValue(expectedResponse as any);

        const result = await adminController.list(query as any, {
          userId: USER_ID,
          accountId: 'acc-1',
          sessionId: 'ses-1',
          deviceId: null,
          isPlatformAdmin: true,
          guardianRolesByFamily: new Map(),
        } as any);

        expect(mockService.list).toHaveBeenCalledWith(query, USER_ID);
        expect(result).toEqual(expectedResponse);
      });
    });

    describe('GET /admin/feedback/:id', () => {
      it('delegates to FeedbackService.getById with id and actorUserId', async () => {
        const response: AdminFeedbackResponseDto = {
          id: FEEDBACK_ID,
          familyId: FAMILY_ID,
          category: 'BUG',
          message: 'There is a bug.',
          status: 'APPROVED',
          identifySelf: false,
          submitterName: null,
          submitterEmail: null,
          pagePath: null,
          locale: null,
          appVersion: null,
          adminNote: null,
          lastIssueError: null,
          githubIssueNumber: 123,
          githubIssueUrl: 'https://github.com/example/issue/123',
          createdAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
        };

        mockService.getById.mockResolvedValue(response);

        const result = await adminController.getOne(FEEDBACK_ID, {
          userId: USER_ID,
        } as any);

        expect(mockService.getById).toHaveBeenCalledWith(FEEDBACK_ID, USER_ID);
        expect(result).toEqual(response);
      });
    });

    describe('POST /admin/feedback/:id/approve', () => {
      it('propagates BadGatewayException from service without wrapping', async () => {
        const dto: ApproveFeedbackDto = {
          title: 'Fix the bug',
          labels: ['bug'],
        };

        mockService.approve.mockRejectedValue(
          new BadGatewayException('Could not open the GitHub issue.'),
        );

        await expect(
          adminController.approve(FEEDBACK_ID, dto as any, {
            userId: USER_ID,
          } as any),
        ).rejects.toBeInstanceOf(BadGatewayException);
        expect(mockService.approve).toHaveBeenCalledWith(
          FEEDBACK_ID,
          USER_ID,
          dto,
        );
      });
    });

    describe('POST /admin/feedback/:id/reject', () => {
      it('delegates to FeedbackService.reject with id, actorUserId and dto', async () => {
        const dto: RejectFeedbackDto = {
          reason: 'Not actionable feedback.',
        };

        const response: AdminFeedbackResponseDto = {
          id: FEEDBACK_ID,
          familyId: FAMILY_ID,
          category: 'QUESTION',
          message: 'Some question',
          status: 'REJECTED',
          identifySelf: false,
          submitterName: null,
          submitterEmail: null,
          pagePath: null,
          locale: null,
          appVersion: null,
          adminNote: 'Not actionable feedback.',
          lastIssueError: null,
          githubIssueNumber: null,
          githubIssueUrl: null,
          createdAt: new Date().toISOString(),
          reviewedAt: new Date().toISOString(),
        };

        mockService.reject.mockResolvedValue(response);

        const result = await adminController.reject(FEEDBACK_ID, dto, {
          userId: USER_ID,
        } as any);

        expect(mockService.reject).toHaveBeenCalledWith(
          FEEDBACK_ID,
          USER_ID,
          dto,
        );
        expect(result).toEqual(response);
      });
    });
  });
});
