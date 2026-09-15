import { randomUUID } from 'node:crypto';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import supertest from 'supertest';
import { createApplication } from '../src/main.js';
import { PrismaService } from '../src/platform/database/prisma.service.js';

// Real-Postgres coverage for the two explicit Definition/Version
// operations added in issue #96 section 24: controlled migration of
// LearnerCompetencyTracking references between CompetencyDefinition
// versions, and logical rollback of a PUBLISHED version. Proves:
//  - migration re-points only the explicitly selected tracking rows,
//    leaving every other tracking row untouched;
//  - migration is traceable via DefinitionVersionOperationLog;
//  - rollback deprecates without deleting or mutating the rolled-back
//    row's content;
//  - rollback correctly changes "current PUBLISHED version" resolution;
//  - entities pinned to an exact version by id (tracking after migration,
//    and the append-only LearnerCompetencyAchievement) are unaffected by
//    a later rollback of that version.
describe('Definition/Version operations: migration + rollback (real Postgres)', () => {
  let app: NestFastifyApplication;
  let db: PrismaService;
  let adminCookie: string;
  let outsiderCookie: string;
  const adminEmail = `defver-admin-${randomUUID()}@example.com`;
  const previousAdmins = process.env.PLATFORM_ADMIN_EMAILS;
  const adminBase = '/api/v1/admin/curriculum-definitions';
  const opsBase = `${adminBase}/version-operations`;

  async function register(email: string) {
    const response = await supertest(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'somePassword123', fullName: 'Def Version Ops Test' })
      .expect(201);
    return [response.headers['set-cookie']].flat().find((value) => value?.startsWith('aletheia_session='))!;
  }

  async function createFamilyWithLearner(namePrefix: string) {
    const email = `${namePrefix}-${randomUUID()}@example.com`;
    const cookie = await register(email);
    const familyResponse = await supertest(app.getHttpServer())
      .post('/api/v1/families')
      .set('Cookie', cookie)
      .send({ name: `${namePrefix} Family`, countryCode: 'BR' })
      .expect(201);
    const familyId = familyResponse.body.id as string;
    const learnerResponse = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${familyId}/learners`)
      .set('Cookie', cookie)
      .send({ firstName: 'Learner', birthDate: '2015-01-01', stage: 'PRIMARY_GRAMMAR' })
      .expect(201);
    return { cookie, familyId, learnerId: learnerResponse.body.id as string };
  }

  async function definition(kind: string, data: Record<string, unknown>) {
    const created = await supertest(app.getHttpServer())
      .post(`${adminBase}/${kind}`)
      .set('Cookie', adminCookie)
      .send({ code: `DEFVEROPS.${randomUUID().replaceAll('-', '').toUpperCase()}`, ...data })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`${adminBase}/${kind}/${created.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);
    return created.body as { id: string; code: string; version: number };
  }

  beforeAll(async () => {
    process.env.PLATFORM_ADMIN_EMAILS = adminEmail;
    app = await createApplication();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    db = app.get(PrismaService);
    adminCookie = await register(adminEmail);
    outsiderCookie = await register(`defver-outsider-${randomUUID()}@example.com`);
  }, 30000);

  afterAll(async () => {
    await app?.close();
    if (previousAdmins === undefined) delete process.env.PLATFORM_ADMIN_EMAILS;
    else process.env.PLATFORM_ADMIN_EMAILS = previousAdmins;
  });

  it('rejects unauthenticated and non-admin requests on both operations', async () => {
    await supertest(app.getHttpServer()).post(`${opsBase}/rollback`).expect(401);
    await supertest(app.getHttpServer()).post(`${opsBase}/competency-tracking-migrations`).expect(401);
    await supertest(app.getHttpServer())
      .post(`${opsBase}/rollback`)
      .set('Cookie', outsiderCookie)
      .send({ entityType: 'CompetencyDefinition', code: 'X', version: 1 })
      .expect(403);
  });

  it('migrates only the explicitly selected tracking, logs the operation, and leaves the rolled-back version and achievement untouched', async () => {
    const code = `DEFVEROPS.COMPETENCY.${randomUUID().replaceAll('-', '').toUpperCase()}`;
    const domain = await definition('learning-domains', { name: 'Def Version Ops Domain' });

    const v1 = await definition('competency-definitions', {
      code,
      version: 1,
      domainId: domain.id,
      title: 'Def Version Ops Competency v1',
    });

    const curriculum = await supertest(app.getHttpServer())
      .post(`${adminBase}/curriculum-definitions`)
      .set('Cookie', adminCookie)
      .send({ code: `DEFVEROPS.CURRICULUM.${randomUUID().replaceAll('-', '').toUpperCase()}`, name: 'Def Version Ops Curriculum' })
      .expect(201);
    await supertest(app.getHttpServer())
      .post(`${adminBase}/curriculum-definitions/${curriculum.body.id}/competencies`)
      .set('Cookie', adminCookie)
      .send({ competencyId: v1.id })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`${adminBase}/curriculum-definitions/${curriculum.body.id}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'PUBLISHED' })
      .expect(200);

    const policy = await definition('progression-policies', {
      name: 'Def Version Ops Policy',
      policyType: 'EVIDENCE_COUNT',
      rules: { minimumEvidenceCount: 1 },
      curriculumDefinitionId: curriculum.body.id,
    });
    const evidenceType = await definition('evidence-type-definitions', { name: 'Def Version Ops Evidence' });

    // Two families, both activated against v1 -- the second one is the
    // "leave everyone else alone" control.
    const target = await createFamilyWithLearner('defver-target');
    const control = await createFamilyWithLearner('defver-control');

    const activateFor = async (family: { cookie: string; familyId: string; learnerId: string }) => {
      const activated = await supertest(app.getHttpServer())
        .post(`/api/v1/families/${family.familyId}/curriculum/competency-tracking/activate`)
        .set('Cookie', family.cookie)
        .send({ learnerId: family.learnerId, curriculumDefinitionId: curriculum.body.id, progressionPolicyId: policy.id })
        .expect(201);
      return activated.body.trackings[0].id as string;
    };
    const targetTrackingId = await activateFor(target);
    const controlTrackingId = await activateFor(control);

    // Award an achievement on the target tracking, pinned to v1, before
    // migrating -- this is the append-only record that must never move.
    const submitted = await supertest(app.getHttpServer())
      .post(`/api/v1/families/${target.familyId}/curriculum/evidence-submissions`)
      .set('Cookie', target.cookie)
      .send({
        learnerId: target.learnerId,
        evidenceTypeId: evidenceType.id,
        textContent: 'Human-reviewed demonstration',
        competencies: [{ competencyDefinitionId: v1.id }],
      })
      .expect(201);
    await supertest(app.getHttpServer())
      .patch(`/api/v1/families/${target.familyId}/curriculum/evidence-submissions/${submitted.body.id}/validation`)
      .set('Cookie', target.cookie)
      .send({ status: 'VALIDATED' })
      .expect(200);
    const achievementBefore = await db.learnerCompetencyAchievement.findUniqueOrThrow({
      where: { trackingId: targetTrackingId },
    });
    expect(achievementBefore.competencyDefinitionId).toBe(v1.id);
    expect(achievementBefore.competencyVersion).toBe(1);

    // Publish a v2 of the same competency code.
    const v2 = await definition('competency-definitions', {
      code,
      version: 2,
      domainId: domain.id,
      title: 'Def Version Ops Competency v2',
    });

    // Migrate ONLY the target's tracking, not the control's.
    const migrateResponse = await supertest(app.getHttpServer())
      .post(`${opsBase}/competency-tracking-migrations`)
      .set('Cookie', adminCookie)
      .send({ code, fromVersion: 1, toVersion: 2, trackingIds: [targetTrackingId], reason: 'test migration' })
      .expect(201);
    expect(migrateResponse.body.migratedTrackingIds).toEqual([targetTrackingId]);
    expect(migrateResponse.body.skippedTrackingIds).toEqual([]);

    const targetTracking = await db.learnerCompetencyTracking.findUniqueOrThrow({ where: { id: targetTrackingId } });
    expect(targetTracking.competencyDefinitionId).toBe(v2.id);
    expect(targetTracking.competencyVersion).toBe(2);

    const controlTracking = await db.learnerCompetencyTracking.findUniqueOrThrow({ where: { id: controlTrackingId } });
    expect(controlTracking.competencyDefinitionId).toBe(v1.id);
    expect(controlTracking.competencyVersion).toBe(1);

    // Traceable: a log row exists describing exactly what happened.
    const logs = await supertest(app.getHttpServer()).get(`${opsBase}/logs`).set('Cookie', adminCookie).query({ code }).expect(200);
    const migrationLog = logs.body.find((entry: { operationType: string }) => entry.operationType === 'MIGRATE_REFERENCES');
    expect(migrationLog).toMatchObject({
      operationType: 'MIGRATE_REFERENCES',
      definitionCode: code,
      fromVersion: 1,
      toVersion: 2,
      affectedEntityType: 'LearnerCompetencyTracking',
      affectedEntityIds: [targetTrackingId],
    });

    // The already-awarded achievement stays pinned to v1 -- append-only,
    // unaffected by the migration of its tracking's live pointer.
    const achievementAfterMigration = await db.learnerCompetencyAchievement.findUniqueOrThrow({
      where: { trackingId: targetTrackingId },
    });
    expect(achievementAfterMigration).toEqual(achievementBefore);

    // --- Rollback v2 ---
    const beforeRollback = await db.competencyDefinition.findUniqueOrThrow({ where: { id: v2.id } });
    const rollbackResponse = await supertest(app.getHttpServer())
      .post(`${opsBase}/rollback`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'CompetencyDefinition', code, version: 2, reason: 'bad content' })
      .expect(201);
    expect(rollbackResponse.body).toMatchObject({
      entityType: 'CompetencyDefinition',
      code,
      rolledBackVersion: 2,
      newCurrentVersion: 1,
    });

    // Append-only: v2's row still exists, same id, same substantive
    // content -- only status/deprecatedAt changed.
    const afterRollback = await db.competencyDefinition.findUniqueOrThrow({ where: { id: v2.id } });
    expect(afterRollback.id).toBe(beforeRollback.id);
    expect(afterRollback.title).toBe(beforeRollback.title);
    expect(afterRollback.code).toBe(beforeRollback.code);
    expect(afterRollback.version).toBe(beforeRollback.version);
    expect(afterRollback.status).toBe('DEPRECATED');
    expect(afterRollback.deprecatedAt).not.toBeNull();

    // "Current PUBLISHED version" resolution (same pattern every
    // *CatalogResolver in this module uses) now falls back to v1.
    const current = await db.competencyDefinition.findFirst({
      where: { code, status: 'PUBLISHED' },
      orderBy: { version: 'desc' },
    });
    expect(current?.id).toBe(v1.id);
    expect(current?.version).toBe(1);

    // The tracking that was migrated onto v2 stays pinned to v2 by id --
    // rollback never repoints an entity that references an exact version.
    const targetTrackingAfterRollback = await db.learnerCompetencyTracking.findUniqueOrThrow({
      where: { id: targetTrackingId },
    });
    expect(targetTrackingAfterRollback.competencyDefinitionId).toBe(v2.id);
    expect(targetTrackingAfterRollback.competencyVersion).toBe(2);

    // The achievement remains pinned to v1, still readable and unaffected.
    const achievementAfterRollback = await db.learnerCompetencyAchievement.findUniqueOrThrow({
      where: { trackingId: targetTrackingId },
    });
    expect(achievementAfterRollback).toEqual(achievementBefore);

    const logsAfterRollback = await supertest(app.getHttpServer()).get(`${opsBase}/logs`).set('Cookie', adminCookie).query({ code }).expect(200);
    const rollbackLogEntry = logsAfterRollback.body.find((entry: { operationType: string }) => entry.operationType === 'ROLLBACK');
    expect(rollbackLogEntry).toMatchObject({
      operationType: 'ROLLBACK',
      definitionCode: code,
      fromVersion: 2,
      toVersion: 1,
      affectedEntityType: 'CompetencyDefinition',
      affectedEntityIds: [v2.id],
    });
  }, 60000);

  it('rejects rolling back a non-PUBLISHED version, and rejects a schema-major-incompatible migration target', async () => {
    const code = `DEFVEROPS.INVALID.${randomUUID().replaceAll('-', '').toUpperCase()}`;
    const domain = await definition('learning-domains', { name: 'Def Version Ops Invalid Domain' });

    await supertest(app.getHttpServer())
      .post(`${adminBase}/competency-definitions`)
      .set('Cookie', adminCookie)
      .send({ code, version: 1, domainId: domain.id, title: 'Draft only' })
      .expect(201);

    await supertest(app.getHttpServer())
      .post(`${opsBase}/rollback`)
      .set('Cookie', adminCookie)
      .send({ entityType: 'CompetencyDefinition', code, version: 1 })
      .expect(400);

    const v1 = await definition('competency-definitions', {
      code,
      version: 2,
      domainId: domain.id,
      title: 'Schema v1',
      schemaVersion: '1.0.0',
    });
    await definition('competency-definitions', {
      code,
      version: 3,
      domainId: domain.id,
      title: 'Schema v2 (major bump)',
      schemaVersion: '2.0.0',
    });

    await supertest(app.getHttpServer())
      .post(`${opsBase}/competency-tracking-migrations`)
      .set('Cookie', adminCookie)
      .send({ code, fromVersion: v1.version, toVersion: 3, trackingIds: [randomUUID()] })
      .expect(400);
  }, 30000);
});
