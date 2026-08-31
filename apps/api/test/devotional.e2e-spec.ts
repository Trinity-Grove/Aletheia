import { NotFoundException } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { AuthService } from '../src/modules/identity/application/auth.service.js';
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from '../src/modules/families/application/public-api.js';
import { DevotionalService } from '../src/modules/devotional/application/devotional.service.js';
import { PrayerService } from '../src/modules/devotional/application/prayer.service.js';
import type {
  BiblePassageDto,
  BibleVersionDto,
  DailyDevotionalResponseDto,
  PrayerResponseDto,
} from '@aletheia/contracts';

describe('Devotional & Prayer E2E & Multi-Tenant Isolation', () => {
  let app: NestFastifyApplication;

  const familyAId = '00000000-0000-4000-8000-000000000001';
  const familyBId = '00000000-0000-4000-8000-000000000002';
  const guardianAToken = 'guardian-a-token';
  const guardianBToken = 'guardian-b-token';
  const guardianAUserId = 'guardian-a-user-id';
  const guardianBUserId = 'guardian-b-user-id';

  let devotionalStore: Array<DailyDevotionalResponseDto> = [];
  let prayerStore: Array<PrayerResponseDto> = [];

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

    // 3. DevotionalService mocking
    const devotionalService = app.get(DevotionalService);

    jest.spyOn(devotionalService, 'upsertDevotional').mockImplementation(async (familyId, dto) => {
      const existingIdx = devotionalStore.findIndex(
        (d) => d.familyId === familyId && d.date === dto.date,
      );

      if (existingIdx >= 0) {
        const updated: DailyDevotionalResponseDto = {
          ...devotionalStore[existingIdx]!,
          bibleReference: dto.bibleReference,
          bibleVersionId: dto.bibleVersionId ?? null,
          passageText: dto.passageText ?? null,
          reflection: dto.reflection ?? null,
          memoryVerse: dto.memoryVerse ?? null,
          hymnOrSong: dto.hymnOrSong ?? null,
          discussionQuestions: Array.isArray(dto.discussionQuestions)
            ? JSON.stringify(dto.discussionQuestions)
            : (dto.discussionQuestions ?? null),
          practicalApplication: dto.practicalApplication ?? null,
          updatedAt: new Date().toISOString(),
        };
        devotionalStore[existingIdx] = updated;
        return updated;
      }

      const created: DailyDevotionalResponseDto = {
        id: `devotional-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        date: dto.date,
        bibleReference: dto.bibleReference,
        bibleVersionId: dto.bibleVersionId ?? null,
        passageText: dto.passageText ?? null,
        reflection: dto.reflection ?? null,
        memoryVerse: dto.memoryVerse ?? null,
        hymnOrSong: dto.hymnOrSong ?? null,
        discussionQuestions: Array.isArray(dto.discussionQuestions)
          ? JSON.stringify(dto.discussionQuestions)
          : (dto.discussionQuestions ?? null),
        practicalApplication: dto.practicalApplication ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      devotionalStore.push(created);
      return created;
    });

    jest.spyOn(devotionalService, 'getDevotionalByDate').mockImplementation(async (familyId, date) => {
      const found = devotionalStore.find((d) => d.familyId === familyId && d.date === date);
      return found ? { ...found } : null;
    });

    jest.spyOn(devotionalService, 'getRecentDevotionals').mockImplementation(async (familyId, limit = 30) => {
      return devotionalStore
        .filter((d) => d.familyId === familyId)
        .slice(0, limit)
        .map((d) => ({ ...d }));
    });

    jest.spyOn(devotionalService, 'lookupScripture').mockImplementation(
      async (reference: string, versionId = '3034'): Promise<BiblePassageDto | null> => {
        return {
          reference,
          versionId,
          content: 'For God so loved the world that He gave His only begotten Son...',
          copyright: 'Berean Standard Bible (BSB) © 2024',
        };
      },
    );

    jest.spyOn(devotionalService, 'getAvailableBibles').mockImplementation(
      async (): Promise<BibleVersionDto[]> => {
        return [
          { id: '3034', name: 'Berean Standard Bible', language: 'en', abbreviation: 'BSB' },
          { id: '1608', name: 'Almeida Revista e Atualizada', language: 'pt', abbreviation: 'ARA' },
        ];
      },
    );

    // 4. PrayerService mocking
    const prayerService = app.get(PrayerService);

    jest.spyOn(prayerService, 'createPrayer').mockImplementation(async (familyId, dto) => {
      const created: PrayerResponseDto = {
        id: `prayer-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        learnerId: dto.learnerId ?? null,
        type: dto.type ?? 'PETITION',
        title: dto.title,
        description: dto.description ?? null,
        isAnswered: false,
        answeredAt: null,
        answeredNote: null,
        archivedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      prayerStore.push(created);
      return created;
    });

    jest.spyOn(prayerService, 'getFamilyPrayers').mockImplementation(async (familyId, filter) => {
      return prayerStore
        .filter((p) => {
          if (p.familyId !== familyId) return false;
          if (filter?.isAnswered !== undefined && p.isAnswered !== filter.isAnswered) return false;
          if (!filter?.includeArchived && p.archivedAt) return false;
          return true;
        })
        .map((p) => ({ ...p }));
    });

    jest.spyOn(prayerService, 'getPrayerById').mockImplementation(async (familyId, id) => {
      const found = prayerStore.find((p) => p.familyId === familyId && p.id === id);
      if (!found) {
        throw new NotFoundException(`Prayer request not found: ${id}`);
      }
      return { ...found };
    });

    jest.spyOn(prayerService, 'updatePrayer').mockImplementation(async (familyId, id, dto) => {
      const idx = prayerStore.findIndex((p) => p.familyId === familyId && p.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Prayer request not found: ${id}`);
      }
      const current = prayerStore[idx]!;
      const updated: PrayerResponseDto = {
        ...current,
        title: dto.title ?? current.title,
        description: dto.description !== undefined ? dto.description : current.description,
        type: dto.type ?? current.type,
        learnerId: dto.learnerId !== undefined ? dto.learnerId : current.learnerId,
        updatedAt: new Date().toISOString(),
      };
      prayerStore[idx] = updated;
      return { ...updated };
    });

    jest.spyOn(prayerService, 'answerPrayer').mockImplementation(async (familyId, id, dto) => {
      const idx = prayerStore.findIndex((p) => p.familyId === familyId && p.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Prayer request not found: ${id}`);
      }
      const current = prayerStore[idx]!;
      const updated: PrayerResponseDto = {
        ...current,
        isAnswered: true,
        answeredAt: new Date().toISOString(),
        answeredNote: dto.answeredNote?.trim() || null,
        updatedAt: new Date().toISOString(),
      };
      prayerStore[idx] = updated;
      return { ...updated };
    });

    jest.spyOn(prayerService, 'archivePrayer').mockImplementation(async (familyId, id) => {
      const idx = prayerStore.findIndex((p) => p.familyId === familyId && p.id === id);
      if (idx === -1) {
        throw new NotFoundException(`Prayer request not found: ${id}`);
      }
      const current = prayerStore[idx]!;
      const updated: PrayerResponseDto = {
        ...current,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      prayerStore[idx] = updated;
      return { ...updated };
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    devotionalStore = [];
    prayerStore = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated Access', () => {
    it('returns 401 Unauthorized when no auth token is provided for devotional endpoints', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/by-date?date=2026-08-25`)
        .expect(401);

      await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/devotionals/by-date`)
        .send({
          date: '2026-08-25',
          bibleReference: 'John 3:16',
        })
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/history`)
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/scripture/lookup?reference=JHN.3.16`)
        .expect(401);
    });

    it('returns 401 Unauthorized when no auth token is provided for prayer endpoints', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers`)
        .expect(401);

      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers`)
        .send({
          type: 'PETITION',
          title: 'Guidance and wisdom',
        })
        .expect(401);
    });

    it('returns 401 Unauthorized when an invalid auth token is provided', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/by-date?date=2026-08-25`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Multi-Tenant Isolation & Boundary Security', () => {
    it('returns 403 Forbidden when Guardian B attempts to access Family A devotional endpoints', async () => {
      // Guardian B tries to read Family A's devotional
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/by-date?date=2026-08-25`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(403);

      // Guardian B tries to upsert Family A's devotional
      await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/devotionals/by-date`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .send({
          date: '2026-08-25',
          bibleReference: 'Romans 8:28',
        })
        .expect(403);

      // Guardian B tries to get Family A's devotional history
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/history`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(403);

      // Guardian B tries to use Family A's route for scripture lookup
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/scripture/lookup?reference=JHN.3.16`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(403);
    });

    it('returns 403 Forbidden when Guardian B attempts to access Family A prayer endpoints', async () => {
      // Guardian B tries to list Family A's prayers
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(403);

      // Guardian B tries to create a prayer in Family A
      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .send({
          type: 'PETITION',
          title: 'Unauthorized prayer',
        })
        .expect(403);

      // Guardian B tries to access/answer Family A's prayer
      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers/prayer-123/answer`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .send({ answeredNote: 'Hacked answer' })
        .expect(403);

      // Guardian B tries to archive Family A's prayer
      await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers/prayer-123/archive`)
        .set('Authorization', `Bearer ${guardianBToken}`)
        .expect(403);
    });

    it('returns 403 Forbidden when Guardian A attempts to access Family B endpoints', async () => {
      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/devotionals/by-date?date=2026-08-25`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);

      await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/prayers`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(403);
    });
  });

  describe('Devotional Lifecycle & Operations within Tenancy', () => {
    it('allows guardian to upsert, fetch by date, update, and view history of devotionals', async () => {
      const devotionalDate = '2026-08-25';

      // 1. Fetch before creating -> returns null (or empty body)
      const initialGetRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/by-date?date=${devotionalDate}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(initialGetRes.body).toBeNull();

      // 2. Upsert Daily Devotional
      const createRes = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/devotionals/by-date`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          date: devotionalDate,
          bibleReference: 'Psalm 23:1-6',
          bibleVersionId: '3034',
          passageText: 'The LORD is my shepherd; I shall not want.',
          reflection: 'God provides and guides His people in righteousness.',
          memoryVerse: 'The LORD is my shepherd; I shall not want.',
          hymnOrSong: 'The King of Love My Shepherd Is',
          discussionQuestions: ['How does God care for us daily?', 'What does resting in green pastures mean?'],
          practicalApplication: 'Trust God in your daily worries and recite Psalm 23 together.',
        })
        .expect(200);

      expect(createRes.body.id).toBeDefined();
      expect(createRes.body.familyId).toBe(familyAId);
      expect(createRes.body.date).toBe(devotionalDate);
      expect(createRes.body.bibleReference).toBe('Psalm 23:1-6');
      expect(createRes.body.memoryVerse).toBe('The LORD is my shepherd; I shall not want.');

      const devotionalId = createRes.body.id;

      // 3. Fetch by Date
      const fetchRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/by-date?date=${devotionalDate}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(fetchRes.body.id).toBe(devotionalId);
      expect(fetchRes.body.reflection).toBe('God provides and guides His people in righteousness.');

      // 4. Update (Upsert again for same date)
      const updateRes = await supertest(app.getHttpServer())
        .put(`/api/v1/families/${familyAId}/devotionals/by-date`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          date: devotionalDate,
          bibleReference: 'Psalm 23:1-6',
          reflection: 'Updated family reflection on the Good Shepherd.',
          memoryVerse: 'The LORD is my shepherd; I shall not want.',
        })
        .expect(200);

      expect(updateRes.body.id).toBe(devotionalId);
      expect(updateRes.body.reflection).toBe('Updated family reflection on the Good Shepherd.');

      // 5. Devotional History
      const historyRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/history?limit=10`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(Array.isArray(historyRes.body)).toBe(true);
      expect(historyRes.body).toHaveLength(1);
      expect(historyRes.body[0].id).toBe(devotionalId);
    });
  });

  describe('Scripture Lookup & Bible Translations', () => {
    it('allows guardian to lookup scripture passage and get available Bibles', async () => {
      // 1. Scripture lookup
      const lookupRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/scripture/lookup?reference=JHN.3.16&versionId=3034`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(lookupRes.body.reference).toBe('JHN.3.16');
      expect(lookupRes.body.versionId).toBe('3034');
      expect(lookupRes.body.content).toContain('For God so loved the world');

      // 2. Available Bible versions
      const biblesRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/devotionals/scripture/bibles`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(Array.isArray(biblesRes.body)).toBe(true);
      expect(biblesRes.body.length).toBeGreaterThanOrEqual(1);
      expect(biblesRes.body[0]).toHaveProperty('abbreviation');
    });
  });

  describe('Prayer Requests Lifecycle & Operations within Tenancy', () => {
    it('allows guardian to create, list, update, mark as answered with notes, and archive prayers', async () => {
      // 1. Create a Petition Prayer
      const petitionRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          type: 'PETITION',
          title: 'Healing for Grandma',
          description: 'Praying for swift recovery after surgery.',
        })
        .expect(201);

      const petitionId = petitionRes.body.id;
      expect(petitionId).toBeDefined();
      expect(petitionRes.body.familyId).toBe(familyAId);
      expect(petitionRes.body.type).toBe('PETITION');
      expect(petitionRes.body.title).toBe('Healing for Grandma');
      expect(petitionRes.body.isAnswered).toBe(false);
      expect(petitionRes.body.archivedAt).toBeNull();

      // 2. Create a Gratitude Prayer
      const gratitudeRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          type: 'GRATITUDE',
          title: 'Thankful for new home',
          description: 'Praising God for provision.',
        })
        .expect(201);

      const gratitudeId = gratitudeRes.body.id;
      expect(gratitudeId).toBeDefined();
      expect(gratitudeRes.body.type).toBe('GRATITUDE');

      // 3. List all Active Prayers
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listRes.body).toHaveLength(2);

      // 4. Get Prayer by ID
      const getRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers/${petitionId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(getRes.body.id).toBe(petitionId);
      expect(getRes.body.title).toBe('Healing for Grandma');

      // 5. Update Prayer
      const updateRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/prayers/${petitionId}`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          title: 'Complete healing for Grandma',
        })
        .expect(200);

      expect(updateRes.body.title).toBe('Complete healing for Grandma');

      // 6. Mark Prayer as Answered
      const answerRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers/${petitionId}/answer`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .send({
          answeredNote: 'Praise God! The doctors reported complete recovery.',
        })
        .expect(200);

      expect(answerRes.body.isAnswered).toBe(true);
      expect(answerRes.body.answeredAt).not.toBeNull();
      expect(answerRes.body.answeredNote).toBe('Praise God! The doctors reported complete recovery.');

      // 7. Filter by isAnswered
      const answeredListRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers?isAnswered=true`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(answeredListRes.body).toHaveLength(1);
      expect(answeredListRes.body[0].id).toBe(petitionId);

      const unansweredListRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers?isAnswered=false`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(unansweredListRes.body).toHaveLength(1);
      expect(unansweredListRes.body[0].id).toBe(gratitudeId);

      // 8. Archive Prayer
      const archiveRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/prayers/${petitionId}/archive`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(archiveRes.body.archivedAt).not.toBeNull();

      // 9. List without includeArchived
      const listAfterArchive = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listAfterArchive.body).toHaveLength(1);
      expect(listAfterArchive.body[0].id).toBe(gratitudeId);

      // 10. List with includeArchived=true
      const listWithArchived = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/prayers?includeArchived=true`)
        .set('Authorization', `Bearer ${guardianAToken}`)
        .expect(200);

      expect(listWithArchived.body).toHaveLength(2);
    });
  });
});
