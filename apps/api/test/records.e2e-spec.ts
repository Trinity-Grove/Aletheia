import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import supertest from "supertest";
import { createApplication } from "../src/main.js";
import { AuthService } from "../src/modules/identity/application/auth.service.js";
import { FAMILY_PUBLIC_API, type FamilyPublicApi } from "../src/modules/families/application/public-api.js";
import { LearningRecordService } from "../src/modules/records/application/learning-record.service.js";
import { PortfolioService } from "../src/modules/records/application/portfolio.service.js";
import type {
  CreateLearningRecordDto,
  CreatePortfolioItemDto,
  LearningRecordFilterDto,
  LearningRecordResponseDto,
  PortfolioItemFilterDto,
  PortfolioItemResponseDto,
  LearnerProgressSummaryDto,
  UpdateLearningRecordDto,
  UpdatePortfolioItemDto,
} from "@aletheia/contracts";

describe("Learning Records & Portfolio E2E & Multi-Tenant Isolation", () => {
  let app: NestFastifyApplication;

  const familyAId = "00000000-0000-0000-0000-000000000001";
  const familyBId = "00000000-0000-0000-0000-000000000002";
  const guardianAToken = "guardian-a-token";
  const guardianBToken = "guardian-b-token";
  const guardianAUserId = "guardian-a-user-id";
  const guardianBUserId = "guardian-b-user-id";

  const learnerAId = "10000000-0000-0000-0000-000000000001";

  let recordsStore: LearningRecordResponseDto[] = [];
  let portfolioStore: PortfolioItemResponseDto[] = [];

  beforeAll(async () => {
    app = await createApplication();

    // 1. Auth mocking
    const authService = app.get(AuthService);
    jest.spyOn(authService, "verifyToken").mockImplementation(async (token) => {
      if (token === guardianAToken) {
        return { userId: guardianAUserId, email: "guardian-a@test.com" };
      }
      if (token === guardianBToken) {
        return { userId: guardianBUserId, email: "guardian-b@test.com" };
      }
      return null;
    });

    // 2. Multi-tenant Family membership check
    const familyPublicApi = app.get<FamilyPublicApi>(FAMILY_PUBLIC_API);
    jest.spyOn(familyPublicApi, "isGuardianInFamily").mockImplementation(async (userId, familyId) => {
      if (userId === guardianAUserId && familyId === familyAId) return true;
      if (userId === guardianBUserId && familyId === familyBId) return true;
      return false;
    });

    // 3. LearningRecordService mocking
    const recordService = app.get(LearningRecordService);
    jest.spyOn(recordService, "createRecord").mockImplementation(async (familyId: string, dto: CreateLearningRecordDto) => {
      const rec: LearningRecordResponseDto = {
        id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        learnerId: dto.learnerId,
        subjectId: dto.subjectId ?? undefined,
        academicYearId: dto.academicYearId ?? undefined,
        lessonPlanId: dto.lessonPlanId ?? undefined,
        title: dto.title,
        description: dto.description ?? undefined,
        type: dto.type ?? "SPONTANEOUS_EXPERIENCE",
        date: dto.date,
        durationMinutes: dto.durationMinutes ?? undefined,
        masteryLevel: dto.masteryLevel ?? "DEVELOPING",
        assessmentMethod: dto.assessmentMethod ?? "OBSERVATION",
        notes: dto.notes ?? undefined,
        strengths: dto.strengths ?? undefined,
        areasForGrowth: dto.areasForGrowth ?? undefined,
        characterHabitGrowth: dto.characterHabitGrowth ?? undefined,
        objectives: [],
        portfolioItemIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      recordsStore.push(rec);
      return rec;
    });

    jest.spyOn(recordService, "listRecords").mockImplementation(async (familyId: string, filter: LearningRecordFilterDto = {}) => {
      return recordsStore.filter((r) => {
        if (r.familyId !== familyId) return false;
        if (filter.learnerId && r.learnerId !== filter.learnerId) return false;
        if (filter.type && r.type !== filter.type) return false;
        return true;
      });
    });

    jest.spyOn(recordService, "getProgressSummary").mockImplementation(async (familyId: string, learnerId: string) => {
      const recs = recordsStore.filter((r) => r.familyId === familyId && r.learnerId === learnerId);
      const summary: LearnerProgressSummaryDto = {
        learnerId,
        totalRecordsCount: recs.length,
        totalMinutesSpent: recs.reduce((acc, r) => acc + (r.durationMinutes || 0), 0),
        masteryDistribution: {
          NOT_STARTED: 0,
          EXPOSURE: 1,
          DEVELOPING: 0,
          WITH_ASSISTANCE: 0,
          AUTONOMOUS: 0,
          MASTERED: 0,
        },
        recordsByType: {
          PLANNED_LESSON: recs.filter((r) => r.type === "PLANNED_LESSON").length,
          SPONTANEOUS_EXPERIENCE: recs.filter((r) => r.type === "SPONTANEOUS_EXPERIENCE").length,
          PROJECT_WORK: 0,
          READING_LOG: 0,
          HABIT_PRACTICE: 0,
        },
        recentMilestones: [],
      };
      return summary;
    });

    jest.spyOn(recordService, "getRecord").mockImplementation(async (familyId: string, id: string) => {
      const found = recordsStore.find((r) => r.familyId === familyId && r.id === id);
      if (!found) throw new Error("Record not found");
      return found;
    });

    jest.spyOn(recordService, "updateRecord").mockImplementation(async (familyId: string, id: string, dto: UpdateLearningRecordDto) => {
      const idx = recordsStore.findIndex((r) => r.familyId === familyId && r.id === id);
      if (idx === -1) throw new Error("Record not found");
      const updated = {
        ...recordsStore[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      } as LearningRecordResponseDto;
      recordsStore[idx] = updated;
      return updated;
    });

    jest.spyOn(recordService, "deleteRecord").mockImplementation(async (familyId: string, id: string) => {
      const idx = recordsStore.findIndex((r) => r.familyId === familyId && r.id === id);
      if (idx === -1) throw new Error("Record not found");
      recordsStore.splice(idx, 1);
      return true;
    });

    // 4. PortfolioService mocking
    const portfolioService = app.get(PortfolioService);
    jest.spyOn(portfolioService, "createItem").mockImplementation(async (familyId: string, dto: CreatePortfolioItemDto) => {
      const item: PortfolioItemResponseDto = {
        id: `port-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        familyId,
        learnerId: dto.learnerId,
        learningRecordId: dto.learningRecordId ?? undefined,
        academicYearId: dto.academicYearId ?? undefined,
        subjectId: dto.subjectId ?? undefined,
        title: dto.title,
        description: dto.description ?? undefined,
        type: dto.type,
        fileUrl: dto.fileUrl ?? undefined,
        textContent: dto.textContent ?? undefined,
        mimeType: dto.mimeType ?? undefined,
        fileSizeBytes: dto.fileSizeBytes ?? undefined,
        capturedAt: dto.capturedAt ?? new Date().toISOString().substring(0, 10),
        isHighlight: dto.isHighlight ?? false,
        tags: dto.tags ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      portfolioStore.push(item);
      return item;
    });

    jest.spyOn(portfolioService, "listItems").mockImplementation(async (familyId: string, filter: PortfolioItemFilterDto = {}) => {
      return portfolioStore.filter((p) => {
        if (p.familyId !== familyId) return false;
        if (filter.learnerId && p.learnerId !== filter.learnerId) return false;
        if (filter.type && p.type !== filter.type) return false;
        return true;
      });
    });

    jest.spyOn(portfolioService, "getItem").mockImplementation(async (familyId: string, id: string) => {
      const found = portfolioStore.find((p) => p.familyId === familyId && p.id === id);
      if (!found) throw new Error("Item not found");
      return found;
    });

    jest.spyOn(portfolioService, "updateItem").mockImplementation(async (familyId: string, id: string, dto: UpdatePortfolioItemDto) => {
      const idx = portfolioStore.findIndex((p) => p.familyId === familyId && p.id === id);
      if (idx === -1) throw new Error("Item not found");
      const updated = {
        ...portfolioStore[idx],
        ...dto,
        updatedAt: new Date().toISOString(),
      } as PortfolioItemResponseDto;
      portfolioStore[idx] = updated;
      return updated;
    });

    jest.spyOn(portfolioService, "deleteItem").mockImplementation(async (familyId: string, id: string) => {
      const idx = portfolioStore.findIndex((p) => p.familyId === familyId && p.id === id);
      if (idx === -1) throw new Error("Item not found");
      portfolioStore.splice(idx, 1);
      return true;
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    recordsStore = [];
    portfolioStore = [];
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Multi-Tenant Access Control", () => {
    it("denies Guardian A access to Family B records endpoints", async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/records`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(res.status).toBe(403);
    });

    it("denies Guardian A access to Family B portfolio endpoints", async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyBId}/portfolio`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(res.status).toBe(403);
    });

    it("rejects unauthenticated requests", async () => {
      const res = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/records`);

      expect(res.status).toBe(401);
    });
  });

  describe("Learning Records Lifecycle", () => {
    it("creates, lists, gets summary, updates and deletes a learning record", async () => {
      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/records`)
        .set("Authorization", `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          title: "Observação de Constelações no Telescópio",
          description: "Identificou as Três Marias e a constelação de Órion no céu noturno com facilidade.",
          type: "SPONTANEOUS_EXPERIENCE",
          date: "2026-08-26",
          durationMinutes: 45,
          masteryLevel: "EXPOSURE",
          assessmentMethod: "OBSERVATION",
          characterHabitGrowth: "Demonstrou grande paciência e curiosidade científica.",
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe("Observação de Constelações no Telescópio");
      const recordId = createRes.body.id;

      // List
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/records?learnerId=${learnerAId}`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);

      // Summary
      const summaryRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/records/summary?learnerId=${learnerAId}`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.totalRecordsCount).toBe(1);

      // Update
      const patchRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/records/${recordId}`)
        .set("Authorization", `Bearer ${guardianAToken}`)
        .send({ masteryLevel: "DEVELOPING" });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.masteryLevel).toBe("DEVELOPING");

      // Delete
      const delRes = await supertest(app.getHttpServer())
        .delete(`/api/v1/families/${familyAId}/records/${recordId}`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(delRes.status).toBe(200);
    });
  });

  describe("Portfolio Items Lifecycle", () => {
    it("creates, lists, updates and deletes portfolio items", async () => {
      const createRes = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${familyAId}/portfolio`)
        .set("Authorization", `Bearer ${guardianAToken}`)
        .send({
          learnerId: learnerAId,
          title: "Desenho da Fauna Brasileira",
          description: "Aquarela representando o Lobo-Guará e a Arara-Azul",
          type: "IMAGE",
          fileUrl: "https://storage.aletheia.com/evidence-1.jpg",
          tags: ["artes", "ciencias", "natureza"],
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe("Desenho da Fauna Brasileira");
      const itemId = createRes.body.id;

      // List
      const listRes = await supertest(app.getHttpServer())
        .get(`/api/v1/families/${familyAId}/portfolio?learnerId=${learnerAId}`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);

      // Update
      const patchRes = await supertest(app.getHttpServer())
        .patch(`/api/v1/families/${familyAId}/portfolio/${itemId}`)
        .set("Authorization", `Bearer ${guardianAToken}`)
        .send({ title: "Desenho da Fauna Brasileira (Final)" });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.title).toBe("Desenho da Fauna Brasileira (Final)");

      // Delete
      const delRes = await supertest(app.getHttpServer())
        .delete(`/api/v1/families/${familyAId}/portfolio/${itemId}`)
        .set("Authorization", `Bearer ${guardianAToken}`);

      expect(delRes.status).toBe(200);
    });
  });
});
