import { NotFoundException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { randomUUID } from 'node:crypto';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import {
  FAMILY_PUBLIC_API,
  type FamilyPublicApi,
} from '../src/modules/families/application/public-api.js';
import { FamilySettingsService } from '../src/modules/settings/application/family-settings.service.js';
import { NotificationService } from '../src/modules/settings/application/notification.service.js';
import { DataExportService } from '../src/modules/settings/application/data-export.service.js';
import type {
  CreateExportJobDto,
  CreateNotificationDto,
  DataExportJobResponseDto,
  FamilyDataExportPackageDto,
  FamilySettingsResponseDto,
  NotificationFilterDto,
  NotificationItemResponseDto,
  UpdateFamilySettingsDto,
} from '@aletheia/contracts';

describe('Family Settings, Notifications & Export E2E & Multi-Tenant Isolation', () => {
  let app: NestFastifyApplication;

  const familyAId = '00000000-0000-0000-0000-000000000001';
  const familyBId = '00000000-0000-0000-0000-000000000002';
  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = '10000000-0000-0000-0000-000000000001';
  const guardianBUserId = '10000000-0000-0000-0000-000000000002';

  let settingsStore: Map<string, FamilySettingsResponseDto>;
  let notificationsStore: NotificationItemResponseDto[];
  let exportJobsStore: DataExportJobResponseDto[];

  beforeAll(async () => {
    app = await createApplication();

    // 1. Auth mocking
    const authService = app.get(AuthService);
    jest.spyOn(authService, 'verifyToken').mockImplementation(async (token) => {
      if (token === guardianAToken) {
        return { userId: guardianAUserId, email: 'guardian-a@test.com' };
      }
      if (token === guardianBToken) {
        return { userId: guardianBUserId, email: 'guardian-b@test.com' };
      }
      return null;
    });

    // 2. Multi-tenant Family membership check
    const familyPublicApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyPublicApi, 'isGuardianInFamily').mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    // 3. FamilySettingsService mocking
    const settingsService = app.get(FamilySettingsService);
    jest.spyOn(settingsService, 'getSettings').mockImplementation(async (familyId: string) => {
      const existing = settingsStore.get(familyId);
      if (existing) return existing;

      const defaultSettings: FamilySettingsResponseDto = {
        id: randomUUID(),
        familyId,
        homeschoolName: null,
        defaultGradingScale: 'MASTERY_QUALITATIVE',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        devotionalReminderTime: null,
        dailyScheduleReminderTime: null,
        attendanceReminderEnabled: true,
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      settingsStore.set(familyId, defaultSettings);
      return defaultSettings;
    });

    jest.spyOn(settingsService, 'updateSettings').mockImplementation(async (familyId: string, dto: UpdateFamilySettingsDto) => {
      const current = await settingsService.getSettings(familyId);
      const updated: FamilySettingsResponseDto = {
        ...current,
        homeschoolName: dto.homeschoolName !== undefined ? dto.homeschoolName : current.homeschoolName,
        defaultGradingScale: dto.defaultGradingScale !== undefined ? dto.defaultGradingScale : current.defaultGradingScale,
        timezone: dto.timezone !== undefined ? dto.timezone : current.timezone,
        language: dto.language !== undefined ? dto.language : current.language,
        devotionalReminderTime: dto.devotionalReminderTime !== undefined ? dto.devotionalReminderTime : current.devotionalReminderTime,
        dailyScheduleReminderTime: dto.dailyScheduleReminderTime !== undefined ? dto.dailyScheduleReminderTime : current.dailyScheduleReminderTime,
        attendanceReminderEnabled: dto.attendanceReminderEnabled !== undefined ? dto.attendanceReminderEnabled : current.attendanceReminderEnabled,
        emailNotificationsEnabled: dto.emailNotificationsEnabled !== undefined ? dto.emailNotificationsEnabled : current.emailNotificationsEnabled,
        inAppNotificationsEnabled: dto.inAppNotificationsEnabled !== undefined ? dto.inAppNotificationsEnabled : current.inAppNotificationsEnabled,
        updatedAt: new Date().toISOString(),
      };
      settingsStore.set(familyId, updated);
      return updated;
    });

    // 4. NotificationService mocking
    const notificationService = app.get(NotificationService);
    jest.spyOn(notificationService, 'createNotification').mockImplementation(async (familyId: string, dto: CreateNotificationDto) => {
      const notification: NotificationItemResponseDto = {
        id: randomUUID(),
        familyId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        linkUrl: dto.linkUrl ?? null,
        isRead: false,
        readAt: null,
        metadata: dto.metadata ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      notificationsStore.push(notification);
      return notification;
    });

    jest.spyOn(notificationService, 'listNotifications').mockImplementation(async (familyId: string, userId: string, filter?: NotificationFilterDto) => {
      return notificationsStore.filter((n) => {
        if (n.familyId !== familyId) return false;
        if (n.userId !== userId) return false;
        if (filter?.isRead !== undefined && n.isRead !== filter.isRead) return false;
        if (filter?.type && n.type !== filter.type) return false;
        return true;
      });
    });

    jest.spyOn(notificationService, 'getUnreadCount').mockImplementation(async (familyId: string, userId: string) => {
      const count = notificationsStore.filter((n) => n.familyId === familyId && n.userId === userId && !n.isRead).length;
      return { count };
    });

    jest.spyOn(notificationService, 'markAsRead').mockImplementation(async (familyId: string, id: string, userId: string, isRead = true) => {
      const notif = notificationsStore.find((n) => n.familyId === familyId && n.id === id && n.userId === userId);
      if (!notif) {
        throw new NotFoundException(`Notification with ID ${id} not found.`);
      }
      notif.isRead = isRead;
      notif.readAt = isRead ? new Date().toISOString() : null;
      notif.updatedAt = new Date().toISOString();
      return notif;
    });

    jest.spyOn(notificationService, 'markAllAsRead').mockImplementation(async (familyId: string, userId: string) => {
      let count = 0;
      for (const n of notificationsStore) {
        if (n.familyId === familyId && n.userId === userId && !n.isRead) {
          n.isRead = true;
          n.readAt = new Date().toISOString();
          n.updatedAt = new Date().toISOString();
          count++;
        }
      }
      return { count };
    });

    // 5. DataExportService mocking
    const dataExportService = app.get(DataExportService);
    jest.spyOn(dataExportService, 'createExportJob').mockImplementation(async (familyId: string, requestedById: string, _dto?: CreateExportJobDto) => {
      const job: DataExportJobResponseDto = {
        id: randomUUID(),
        familyId,
        requestedById,
        status: 'PENDING',
        downloadUrl: null,
        fileSizeBytes: null,
        completedAt: null,
        errorReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      exportJobsStore.push(job);
      return job;
    });

    jest.spyOn(dataExportService, 'getExportJob').mockImplementation(async (familyId: string, id: string) => {
      const job = exportJobsStore.find((j) => j.familyId === familyId && j.id === id);
      if (!job) {
        throw new NotFoundException(`Data export job with ID ${id} not found.`);
      }
      return job;
    });

    jest.spyOn(dataExportService, 'listExportJobs').mockImplementation(async (familyId: string) => {
      return exportJobsStore.filter((j) => j.familyId === familyId);
    });

    jest.spyOn(dataExportService, 'exportFamilyData').mockImplementation(async (familyId: string) => {
      const exportPackage: FamilyDataExportPackageDto = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        family: { id: familyId, name: familyId === familyAId ? 'Family Alpha' : 'Family Beta' },
        settings: settingsStore.get(familyId) ?? null,
        members: [{ userId: familyId === familyAId ? guardianAUserId : guardianBUserId, role: 'GUARDIAN' }],
        learners: [],
        devotionals: [],
        prayerRequests: [],
        academicYears: [],
        subjects: [],
        curriculumPlans: [],
        lessonPlans: [],
        scheduleSlots: [],
        learningRecords: [],
        portfolioItems: [],
        attendanceRecords: [],
        complianceRequirements: [],
        officialReports: [],
      };
      return exportPackage;
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    settingsStore = new Map();
    notificationsStore = [];
    exportJobsStore = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Multi-Tenant Boundary & Access Control', () => {
    it('denies unauthenticated requests with 401 Unauthorized for all endpoints', async () => {
      const dummyId = randomUUID();

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/settings`)
        .expect(401);

      await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/settings`)
        .send({ homeschoolName: 'Unauthorized Patch' })
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications`)
        .send({
          userId: guardianAUserId,
          type: 'SYSTEM_NOTICE',
          title: 'Unauth',
          message: 'Unauth message',
        })
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications`)
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications/unread-count`)
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications/${dummyId}/read`)
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications/read-all`)
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/export`)
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/export/package`)
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/export/${dummyId}`)
        .expect(401);
    });

    it('denies Guardian A access to Family B settings endpoints with 403 Forbidden', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/settings`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);

      await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyBId}/settings`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({ homeschoolName: 'Intruder School' })
        .expect(403);
    });

    it('denies Guardian A access to Family B notifications endpoints with 403 Forbidden', async () => {
      const dummyId = randomUUID();

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyBId}/notifications`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          userId: guardianBUserId,
          type: 'SYSTEM_NOTICE',
          title: 'Cross Tenant',
          message: 'Should be blocked',
        })
        .expect(403);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/notifications`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/notifications/unread-count`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyBId}/notifications/${dummyId}/read`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyBId}/notifications/read-all`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);
    });

    it('denies Guardian A access to Family B export endpoints with 403 Forbidden', async () => {
      const dummyId = randomUUID();

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyBId}/export`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({})
        .expect(403);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/export/package`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/export/${dummyId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);
    });
  });

  describe('Settings Lifecycle', () => {
    it('retrieves default settings for a family and updates settings successfully', async () => {
      // 1. GET initial default settings
      const getRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/settings`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(getRes.body.familyId).toBe(familyAId);
      expect(getRes.body.defaultGradingScale).toBe('MASTERY_QUALITATIVE');
      expect(getRes.body.timezone).toBe('America/Sao_Paulo');
      expect(getRes.body.language).toBe('pt-BR');
      expect(getRes.body.attendanceReminderEnabled).toBe(true);

      // 2. PATCH settings
      const patchRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/settings`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          homeschoolName: 'Providence Classical Academy',
          defaultGradingScale: 'PERCENTAGE_0_100',
          timezone: 'America/New_York',
          language: 'en-US',
          devotionalReminderTime: '07:30',
          dailyScheduleReminderTime: '08:15',
          attendanceReminderEnabled: false,
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: false,
        })
        .expect(200);

      expect(patchRes.body.familyId).toBe(familyAId);
      expect(patchRes.body.homeschoolName).toBe('Providence Classical Academy');
      expect(patchRes.body.defaultGradingScale).toBe('PERCENTAGE_0_100');
      expect(patchRes.body.timezone).toBe('America/New_York');
      expect(patchRes.body.language).toBe('en-US');
      expect(patchRes.body.devotionalReminderTime).toBe('07:30');
      expect(patchRes.body.dailyScheduleReminderTime).toBe('08:15');
      expect(patchRes.body.attendanceReminderEnabled).toBe(false);
      expect(patchRes.body.emailNotificationsEnabled).toBe(true);
      expect(patchRes.body.inAppNotificationsEnabled).toBe(false);

      // 3. GET settings again to verify persistence
      const verifyRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/settings`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(verifyRes.body.homeschoolName).toBe('Providence Classical Academy');
      expect(verifyRes.body.defaultGradingScale).toBe('PERCENTAGE_0_100');

      // 4. Isolation check: Family B settings remain default
      const famBRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/settings`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(200);

      expect(famBRes.body.familyId).toBe(familyBId);
      expect(famBRes.body.homeschoolName).toBeNull();
      expect(famBRes.body.defaultGradingScale).toBe('MASTERY_QUALITATIVE');
    });
  });

  describe('Notifications Lifecycle', () => {
    it('creates, lists, counts unread, and marks notifications as read', async () => {
      // 1. Initial unread count should be 0
      const initialCountRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications/unread-count`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(initialCountRes.body.count).toBe(0);

      // 2. Create notification 1
      const notif1Res = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          userId: guardianAUserId,
          type: 'DEVOTIONAL_REMINDER',
          title: 'Daily Devotional',
          message: 'Remember to complete today’s devotional reading.',
          linkUrl: '/devotionals',
          metadata: { priority: 'high' },
        })
        .expect(201);

      expect(notif1Res.body.id).toBeDefined();
      expect(notif1Res.body.familyId).toBe(familyAId);
      expect(notif1Res.body.title).toBe('Daily Devotional');
      expect(notif1Res.body.isRead).toBe(false);

      const notif1Id = notif1Res.body.id;

      // 3. Create notification 2
      const notif2Res = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          userId: guardianAUserId,
          type: 'ATTENDANCE_MISSING_REMINDER',
          title: 'Attendance Reminder',
          message: 'Attendance has not been logged for today.',
          linkUrl: '/attendance',
        })
        .expect(201);

      expect(notif2Res.body.id).toBeDefined();

      // 4. Verify unread count is now 2
      const countRes2 = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications/unread-count`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(countRes2.body.count).toBe(2);

      // 5. List notifications
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(2);

      // 6. Mark notification 1 as read
      const read1Res = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications/${notif1Id}/read`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(201);

      expect(read1Res.body.id).toBe(notif1Id);
      expect(read1Res.body.isRead).toBe(true);
      expect(read1Res.body.readAt).toBeDefined();

      // 7. Verify unread count is now 1
      const countRes3 = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications/unread-count`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(countRes3.body.count).toBe(1);

      // 8. Mark all remaining notifications as read
      const readAllRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/notifications/read-all`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(201);

      expect(readAllRes.body.count).toBe(1);

      // 9. Verify unread count is now 0
      const finalCountRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications/unread-count`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(finalCountRes.body.count).toBe(0);

      // 10. Verify notification 2 is now marked read
      const unreadListRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/notifications?isRead=false`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(unreadListRes.body).toHaveLength(0);
    });
  });

  describe('Data Export Lifecycle', () => {
    it('creates an export job, retrieves export package, and gets job status', async () => {
      // 1. Create Export Job
      const createJobRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/export`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({ notes: 'End of year full backup' })
        .expect(201);

      expect(createJobRes.body.id).toBeDefined();
      expect(createJobRes.body.familyId).toBe(familyAId);
      expect(createJobRes.body.requestedById).toBe(guardianAUserId);
      expect(createJobRes.body.status).toBe('PENDING');

      const jobId = createJobRes.body.id;

      // 2. Get Export Job by ID
      const getJobRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/export/${jobId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(getJobRes.body.id).toBe(jobId);
      expect(getJobRes.body.familyId).toBe(familyAId);
      expect(getJobRes.body.status).toBe('PENDING');

      // 3. Get Full Export Package
      const packageRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/export/package`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(packageRes.body.version).toBe('1.0.0');
      expect(packageRes.body.exportedAt).toBeDefined();
      expect(packageRes.body.family.id).toBe(familyAId);
      expect(packageRes.body.family.name).toBe('Family Alpha');
      expect(Array.isArray(packageRes.body.members)).toBe(true);
      expect(Array.isArray(packageRes.body.learners)).toBe(true);
    });
  });
});
