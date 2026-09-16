import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { ConsentAction, ConsentDefinition, ConsentRecord } from '@prisma/client';
import { FamilyConsentService } from './family-consent.service.js';
import type { FamilyConsentRepository } from '../infrastructure/family-consent.repository.js';
import type { ConsentDefinitionsRepository } from '../infrastructure/consent-definitions.repository.js';

function buildDefinition(overrides: Partial<ConsentDefinition> = {}): ConsentDefinition {
  return {
    id: 'cd-1',
    code: 'TERMS_OF_SERVICE',
    version: 1,
    status: 'PUBLISHED',
    schemaVersion: 1,
    scope: 'FAMILY',
    mandatory: true,
    title: 'Terms of Service',
    description: 'Core platform terms',
    content: 'Terms and conditions content...',
    purposes: ['Platform access'],
    metadata: null,
    publishedAt: new Date('2026-09-16T01:00:00Z'),
    deprecatedAt: null,
    createdAt: new Date('2026-09-16T00:00:00Z'),
    updatedAt: new Date('2026-09-16T01:00:00Z'),
    ...overrides,
  } as ConsentDefinition;
}

function buildRecord(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: 'rec-1',
    familyId: 'fam-1',
    learnerId: null,
    consentDefinitionId: 'cd-1',
    action: 'GRANTED' as ConsentAction,
    consentedByUserId: 'user-1',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 TestBrowser',
    createdAt: new Date('2026-09-16T02:00:00Z'),
    ...overrides,
  } as ConsentRecord;
}

describe('FamilyConsentService', () => {
  function buildService(
    familyRepoOverrides: Partial<FamilyConsentRepository> = {},
    defsRepoOverrides: Partial<ConsentDefinitionsRepository> = {},
  ) {
    const familyRepo = {
      createRecord: jest.fn(),
      findLatestRecord: jest.fn(),
      findAllRecordsForFamily: jest.fn(),
      findFamilyLearners: jest.fn(),
      findLearnerById: jest.fn(),
      ...familyRepoOverrides,
    } as unknown as FamilyConsentRepository;

    const consentDefsRepo = {
      create: jest.fn(),
      list: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findPublished: jest.fn(),
      updateStatus: jest.fn(),
      ...defsRepoOverrides,
    } as unknown as ConsentDefinitionsRepository;

    const service = new FamilyConsentService(familyRepo, consentDefsRepo);
    return { service, familyRepo, consentDefsRepo };
  }

  describe('grantConsent', () => {
    it('appends an immutable ConsentRecord with GRANTED, ipAddress, userAgent and userId', async () => {
      const def = buildDefinition({ id: 'cd-1', scope: 'FAMILY', status: 'PUBLISHED' });
      const record = buildRecord({
        id: 'rec-new',
        familyId: 'fam-1',
        learnerId: null,
        consentDefinitionId: 'cd-1',
        action: 'GRANTED',
        consentedByUserId: 'user-1',
        ipAddress: '10.0.0.1',
        userAgent: 'JestClient',
      });

      const { service, familyRepo, consentDefsRepo } = buildService(
        { createRecord: jest.fn().mockResolvedValue(record) },
        { findById: jest.fn().mockResolvedValue(def) },
      );

      const result = await service.grantConsent(
        'fam-1',
        'user-1',
        { consentDefinitionId: 'cd-1' },
        { ipAddress: '10.0.0.1', userAgent: 'JestClient' },
      );

      expect(consentDefsRepo.findById).toHaveBeenCalledWith('cd-1');
      expect(familyRepo.createRecord).toHaveBeenCalledWith({
        familyId: 'fam-1',
        userId: 'user-1',
        consentDefinitionId: 'cd-1',
        learnerId: null,
        action: 'GRANTED',
        ipAddress: '10.0.0.1',
        userAgent: 'JestClient',
      });
      expect(result).toEqual({
        id: 'rec-new',
        familyId: 'fam-1',
        learnerId: null,
        consentDefinitionId: 'cd-1',
        action: 'GRANTED',
        consentedByUserId: 'user-1',
        ipAddress: '10.0.0.1',
        userAgent: 'JestClient',
        createdAt: record.createdAt.toISOString(),
      });
    });

    it('throws BadRequestException if consent definition is not found', async () => {
      const { service, consentDefsRepo } = buildService({}, { findById: jest.fn().mockResolvedValue(null) });

      await expect(
        service.grantConsent('fam-1', 'user-1', { consentDefinitionId: 'missing' }, {}),
      ).rejects.toThrow(new BadRequestException('Consent definition is not currently published.'));
      expect(consentDefsRepo.findById).toHaveBeenCalledWith('missing');
    });

    it('throws BadRequestException if definition status is not PUBLISHED', async () => {
      const def = buildDefinition({ status: 'DRAFT' });
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(def) });

      await expect(
        service.grantConsent('fam-1', 'user-1', { consentDefinitionId: def.id }, {}),
      ).rejects.toThrow(new BadRequestException('Consent definition is not currently published.'));
    });

    it('throws BadRequestException if learnerId is provided for FAMILY-scoped consent', async () => {
      const def = buildDefinition({ scope: 'FAMILY', status: 'PUBLISHED' });
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(def) });

      await expect(
        service.grantConsent(
          'fam-1',
          'user-1',
          { consentDefinitionId: def.id, learnerId: '00000000-0000-0000-0000-000000000001' },
          {},
        ),
      ).rejects.toThrow(new BadRequestException('Learner ID must not be provided for family-scoped consent.'));
    });

    it('throws BadRequestException if learnerId is missing for LEARNER-scoped consent', async () => {
      const def = buildDefinition({ scope: 'LEARNER', status: 'PUBLISHED' });
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(def) });

      await expect(
        service.grantConsent('fam-1', 'user-1', { consentDefinitionId: def.id }, {}),
      ).rejects.toThrow(new BadRequestException('Learner ID is required for learner-scoped consent.'));
    });

    it('throws BadRequestException if learner does not belong to family', async () => {
      const def = buildDefinition({ scope: 'LEARNER', status: 'PUBLISHED' });
      const { service, familyRepo } = buildService(
        {
          findLearnerById: jest.fn().mockResolvedValue({
            id: 'learner-alien',
            familyId: 'other-family',
            firstName: 'Eve',
            lastName: null,
          }),
        },
        { findById: jest.fn().mockResolvedValue(def) },
      );

      await expect(
        service.grantConsent('fam-1', 'user-1', { consentDefinitionId: def.id, learnerId: 'learner-alien' }, {}),
      ).rejects.toThrow(new BadRequestException('Learner does not belong to this family.'));
      expect(familyRepo.findLearnerById).toHaveBeenCalledWith('learner-alien');
    });

    it('grants learner-scoped consent when learner belongs to family', async () => {
      const def = buildDefinition({ scope: 'LEARNER', status: 'PUBLISHED' });
      const record = buildRecord({
        consentDefinitionId: def.id,
        learnerId: 'learner-1',
        action: 'GRANTED',
      });
      const { service, familyRepo } = buildService(
        {
          findLearnerById: jest.fn().mockResolvedValue({
            id: 'learner-1',
            familyId: 'fam-1',
            firstName: 'Alice',
            lastName: 'Doe',
          }),
          createRecord: jest.fn().mockResolvedValue(record),
        },
        { findById: jest.fn().mockResolvedValue(def) },
      );

      const result = await service.grantConsent(
        'fam-1',
        'user-1',
        { consentDefinitionId: def.id, learnerId: 'learner-1' },
        { ipAddress: '127.0.0.1', userAgent: 'Agent' },
      );

      expect(familyRepo.createRecord).toHaveBeenCalledWith({
        familyId: 'fam-1',
        userId: 'user-1',
        consentDefinitionId: def.id,
        learnerId: 'learner-1',
        action: 'GRANTED',
        ipAddress: '127.0.0.1',
        userAgent: 'Agent',
      });
      expect(result.learnerId).toBe('learner-1');
      expect(result.action).toBe('GRANTED');
    });
  });

  describe('revokeConsent', () => {
    it('throws NotFoundException if consent definition is not found', async () => {
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(null) });

      await expect(
        service.revokeConsent('fam-1', 'user-1', { consentDefinitionId: 'missing' }, {}),
      ).rejects.toThrow(new NotFoundException('Consent definition not found.'));
    });

    it('throws BadRequestException when attempting to revoke mandatory consent', async () => {
      const def = buildDefinition({ mandatory: true, status: 'PUBLISHED' });
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(def) });

      await expect(
        service.revokeConsent('fam-1', 'user-1', { consentDefinitionId: def.id }, {}),
      ).rejects.toThrow(new BadRequestException('Mandatory consent terms cannot be revoked.'));
    });

    it('throws BadRequestException if learnerId is provided for FAMILY-scoped consent', async () => {
      const def = buildDefinition({ scope: 'FAMILY', mandatory: false, status: 'PUBLISHED' });
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(def) });

      await expect(
        service.revokeConsent(
          'fam-1',
          'user-1',
          { consentDefinitionId: def.id, learnerId: '00000000-0000-0000-0000-000000000001' },
          {},
        ),
      ).rejects.toThrow(new BadRequestException('Learner ID must not be provided for family-scoped consent.'));
    });

    it('throws BadRequestException if learnerId is missing for LEARNER-scoped consent', async () => {
      const def = buildDefinition({ scope: 'LEARNER', mandatory: false, status: 'PUBLISHED' });
      const { service } = buildService({}, { findById: jest.fn().mockResolvedValue(def) });

      await expect(
        service.revokeConsent('fam-1', 'user-1', { consentDefinitionId: def.id }, {}),
      ).rejects.toThrow(new BadRequestException('Learner ID is required for learner-scoped consent.'));
    });

    it('throws BadRequestException if learner does not belong to family during revoke', async () => {
      const def = buildDefinition({ scope: 'LEARNER', mandatory: false, status: 'PUBLISHED' });
      const { service } = buildService(
        { findLearnerById: jest.fn().mockResolvedValue(null) },
        { findById: jest.fn().mockResolvedValue(def) },
      );

      await expect(
        service.revokeConsent('fam-1', 'user-1', { consentDefinitionId: def.id, learnerId: 'unknown-learner' }, {}),
      ).rejects.toThrow(new BadRequestException('Learner does not belong to this family.'));
    });

    it('appends a new ConsentRecord with REVOKED for optional consent', async () => {
      const def = buildDefinition({ mandatory: false, scope: 'FAMILY', status: 'PUBLISHED' });
      const record = buildRecord({
        id: 'rec-revoked',
        consentDefinitionId: def.id,
        action: 'REVOKED',
        consentedByUserId: 'user-1',
      });
      const { service, familyRepo } = buildService(
        { createRecord: jest.fn().mockResolvedValue(record) },
        { findById: jest.fn().mockResolvedValue(def) },
      );

      const result = await service.revokeConsent(
        'fam-1',
        'user-1',
        { consentDefinitionId: def.id },
        { ipAddress: '1.2.3.4', userAgent: 'RevokeAgent' },
      );

      expect(familyRepo.createRecord).toHaveBeenCalledWith({
        familyId: 'fam-1',
        userId: 'user-1',
        consentDefinitionId: def.id,
        learnerId: null,
        action: 'REVOKED',
        ipAddress: '1.2.3.4',
        userAgent: 'RevokeAgent',
      });
      expect(result.action).toBe('REVOKED');
    });
  });

  describe('getFamilyConsentOverview', () => {
    it('computes ACTIVE status when latest record is GRANTED for FAMILY scope', async () => {
      const def = buildDefinition({ id: 'cd-1', code: 'TERMS', version: 1, scope: 'FAMILY' });
      const record = buildRecord({
        consentDefinitionId: 'cd-1',
        learnerId: null,
        action: 'GRANTED',
        createdAt: new Date('2026-09-16T03:00:00Z'),
      });

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue([record]),
          findFamilyLearners: jest.fn().mockResolvedValue([]),
        },
        {
          findPublished: jest.fn().mockResolvedValue([def]),
          findByCode: jest.fn().mockResolvedValue([def]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');

      expect(overview.familyId).toBe('fam-1');
      expect(overview.terms).toHaveLength(1);
      expect(overview.terms[0]!.status).toBe('ACTIVE');
      expect(overview.terms[0]!.lastRecord?.id).toBe(record.id);
    });

    it('computes REVOKED status when latest record is REVOKED for FAMILY scope', async () => {
      const def = buildDefinition({ id: 'cd-opt', code: 'NEWSLETTER', version: 1, scope: 'FAMILY', mandatory: false });
      const recordGranted = buildRecord({
        id: 'rec-g',
        consentDefinitionId: 'cd-opt',
        action: 'GRANTED',
        createdAt: new Date('2026-09-16T01:00:00Z'),
      });
      const recordRevoked = buildRecord({
        id: 'rec-r',
        consentDefinitionId: 'cd-opt',
        action: 'REVOKED',
        createdAt: new Date('2026-09-16T02:00:00Z'),
      });

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue([recordRevoked, recordGranted]),
          findFamilyLearners: jest.fn().mockResolvedValue([]),
        },
        {
          findPublished: jest.fn().mockResolvedValue([def]),
          findByCode: jest.fn().mockResolvedValue([def]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');

      expect(overview.terms[0]!.status).toBe('REVOKED');
      expect(overview.terms[0]!.lastRecord?.id).toBe('rec-r');
    });

    it('computes OUTDATED status when family granted an older version of the same code', async () => {
      const defV1 = buildDefinition({ id: 'cd-v1', code: 'TERMS', version: 1, status: 'DEPRECATED' });
      const defV2 = buildDefinition({ id: 'cd-v2', code: 'TERMS', version: 2, status: 'PUBLISHED' });
      const v1Record = buildRecord({
        id: 'rec-v1',
        consentDefinitionId: 'cd-v1',
        action: 'GRANTED',
        createdAt: new Date('2026-09-16T01:00:00Z'),
      });

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue([v1Record]),
          findFamilyLearners: jest.fn().mockResolvedValue([]),
        },
        {
          findPublished: jest.fn().mockResolvedValue([defV2]),
          findByCode: jest.fn().mockResolvedValue([defV2, defV1]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');

      expect(overview.terms[0]!.status).toBe('OUTDATED');
      expect(overview.terms[0]!.lastRecord?.id).toBe('rec-v1');
    });

    it('computes PENDING status when no record exists for the term or any older version', async () => {
      const def = buildDefinition({ id: 'cd-new', code: 'NEW_TERMS', version: 1 });

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue([]),
          findFamilyLearners: jest.fn().mockResolvedValue([]),
        },
        {
          findPublished: jest.fn().mockResolvedValue([def]),
          findByCode: jest.fn().mockResolvedValue([def]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');

      expect(overview.terms[0]!.status).toBe('PENDING');
      expect(overview.terms[0]!.lastRecord).toBeNull();
    });

    it('computes per-learner statuses and overall term status for LEARNER scope', async () => {
      const def = buildDefinition({
        id: 'cd-learner',
        code: 'AI_TUTOR_SHARING',
        version: 1,
        scope: 'LEARNER',
        mandatory: false,
      });
      const learners = [
        { id: 'l-1', firstName: 'Alice', lastName: 'Smith' },
        { id: 'l-2', firstName: 'Bob', lastName: null },
      ];
      const aliceRecord = buildRecord({
        id: 'rec-alice',
        consentDefinitionId: 'cd-learner',
        learnerId: 'l-1',
        action: 'GRANTED',
      });

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue([aliceRecord]),
          findFamilyLearners: jest.fn().mockResolvedValue(learners),
        },
        {
          findPublished: jest.fn().mockResolvedValue([def]),
          findByCode: jest.fn().mockResolvedValue([def]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');

      expect(overview.terms).toHaveLength(1);
      const term = overview.terms[0]!;
      expect(term.status).toBe('PENDING'); // Alice is ACTIVE, Bob is PENDING -> overall PENDING
      expect(term.learnerStatuses).toEqual([
        {
          learnerId: 'l-1',
          learnerName: 'Alice Smith',
          status: 'ACTIVE',
          lastRecord: expect.objectContaining({ id: 'rec-alice', action: 'GRANTED' }),
        },
        {
          learnerId: 'l-2',
          learnerName: 'Bob',
          status: 'PENDING',
          lastRecord: null,
        },
      ]);
    });

    it('computes overall term status as ACTIVE when all learners are ACTIVE', async () => {
      const def = buildDefinition({ id: 'cd-l', code: 'LEARNER_DATA', version: 1, scope: 'LEARNER' });
      const learners = [
        { id: 'l-1', firstName: 'Alice', lastName: null },
        { id: 'l-2', firstName: 'Bob', lastName: null },
      ];
      const records = [
        buildRecord({ id: 'rec-1', consentDefinitionId: 'cd-l', learnerId: 'l-1', action: 'GRANTED' }),
        buildRecord({ id: 'rec-2', consentDefinitionId: 'cd-l', learnerId: 'l-2', action: 'GRANTED' }),
      ];

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue(records),
          findFamilyLearners: jest.fn().mockResolvedValue(learners),
        },
        {
          findPublished: jest.fn().mockResolvedValue([def]),
          findByCode: jest.fn().mockResolvedValue([def]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');
      expect(overview.terms[0]!.status).toBe('ACTIVE');
    });

    it('computes overall term status as REVOKED when any learner is REVOKED', async () => {
      const def = buildDefinition({ id: 'cd-l', code: 'LEARNER_DATA', version: 1, scope: 'LEARNER' });
      const learners = [
        { id: 'l-1', firstName: 'Alice', lastName: null },
        { id: 'l-2', firstName: 'Bob', lastName: null },
      ];
      const records = [
        buildRecord({ id: 'rec-1', consentDefinitionId: 'cd-l', learnerId: 'l-1', action: 'GRANTED' }),
        buildRecord({ id: 'rec-2', consentDefinitionId: 'cd-l', learnerId: 'l-2', action: 'REVOKED' }),
      ];

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue(records),
          findFamilyLearners: jest.fn().mockResolvedValue(learners),
        },
        {
          findPublished: jest.fn().mockResolvedValue([def]),
          findByCode: jest.fn().mockResolvedValue([def]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');
      expect(overview.terms[0]!.status).toBe('REVOKED');
    });

    it('computes overall term status as OUTDATED when any learner is OUTDATED and none REVOKED', async () => {
      const defV1 = buildDefinition({ id: 'cd-v1', code: 'LEARNER_DATA', version: 1, scope: 'LEARNER' });
      const defV2 = buildDefinition({ id: 'cd-v2', code: 'LEARNER_DATA', version: 2, scope: 'LEARNER' });
      const learners = [
        { id: 'l-1', firstName: 'Alice', lastName: null },
        { id: 'l-2', firstName: 'Bob', lastName: null },
      ];
      const records = [
        buildRecord({ id: 'rec-alice-v2', consentDefinitionId: 'cd-v2', learnerId: 'l-1', action: 'GRANTED' }),
        buildRecord({ id: 'rec-bob-v1', consentDefinitionId: 'cd-v1', learnerId: 'l-2', action: 'GRANTED' }),
      ];

      const { service } = buildService(
        {
          findAllRecordsForFamily: jest.fn().mockResolvedValue(records),
          findFamilyLearners: jest.fn().mockResolvedValue(learners),
        },
        {
          findPublished: jest.fn().mockResolvedValue([defV2]),
          findByCode: jest.fn().mockResolvedValue([defV2, defV1]),
        },
      );

      const overview = await service.getFamilyConsentOverview('fam-1');
      expect(overview.terms[0]!.status).toBe('OUTDATED');
    });
  });

  describe('checkMandatoryCompliance', () => {
    it('returns compliant: true when all published mandatory terms are granted', async () => {
      const familyMandatory = buildDefinition({ id: 'cd-fam', scope: 'FAMILY', mandatory: true });
      const learnerMandatory = buildDefinition({ id: 'cd-lrn', scope: 'LEARNER', mandatory: true });
      const learners = [{ id: 'l-1', firstName: 'Alice', lastName: null }];

      const { service, familyRepo } = buildService(
        {
          findFamilyLearners: jest.fn().mockResolvedValue(learners),
          findLatestRecord: jest
            .fn()
            .mockImplementation(async (_famId: string, defId: string, learnerId?: string | null) => {
              if (defId === 'cd-fam' && learnerId === null) {
                return buildRecord({ consentDefinitionId: 'cd-fam', action: 'GRANTED' });
              }
              if (defId === 'cd-lrn' && learnerId === 'l-1') {
                return buildRecord({ consentDefinitionId: 'cd-lrn', learnerId: 'l-1', action: 'GRANTED' });
              }
              return null;
            }),
        },
        {
          findPublished: jest.fn().mockResolvedValue([familyMandatory, learnerMandatory]),
        },
      );

      const result = await service.checkMandatoryCompliance('fam-1');

      expect(result.compliant).toBe(true);
      expect(result.pendingMandatoryTerms).toHaveLength(0);
      expect(familyRepo.findLatestRecord).toHaveBeenCalledWith('fam-1', 'cd-fam', null);
      expect(familyRepo.findLatestRecord).toHaveBeenCalledWith('fam-1', 'cd-lrn', 'l-1');
    });

    it('returns compliant: false with pendingMandatoryTerms when family mandatory term is missing', async () => {
      const familyMandatory = buildDefinition({ id: 'cd-fam', scope: 'FAMILY', mandatory: true });

      const { service } = buildService(
        {
          findLatestRecord: jest.fn().mockResolvedValue(null),
        },
        {
          findPublished: jest.fn().mockResolvedValue([familyMandatory]),
        },
      );

      const result = await service.checkMandatoryCompliance('fam-1');

      expect(result.compliant).toBe(false);
      expect(result.pendingMandatoryTerms).toHaveLength(1);
      expect(result.pendingMandatoryTerms[0]!.id).toBe('cd-fam');
    });

    it('returns compliant: false when checking specific learnerId and learner term is not granted', async () => {
      const familyMandatory = buildDefinition({ id: 'cd-fam', scope: 'FAMILY', mandatory: true });
      const learnerMandatory = buildDefinition({ id: 'cd-lrn', scope: 'LEARNER', mandatory: true });

      const { service } = buildService(
        {
          findLatestRecord: jest
            .fn()
            .mockImplementation(async (_famId: string, defId: string, learnerId?: string | null) => {
              if (defId === 'cd-fam') {
                return buildRecord({ consentDefinitionId: 'cd-fam', action: 'GRANTED' });
              }
              if (defId === 'cd-lrn' && learnerId === 'l-1') {
                return null;
              }
              return null;
            }),
        },
        {
          findPublished: jest.fn().mockResolvedValue([familyMandatory, learnerMandatory]),
        },
      );

      const result = await service.checkMandatoryCompliance('fam-1', 'l-1');

      expect(result.compliant).toBe(false);
      expect(result.pendingMandatoryTerms).toHaveLength(1);
      expect(result.pendingMandatoryTerms[0]!.id).toBe('cd-lrn');
    });

    it('returns compliant: false when no learnerId given and at least one learner lacks mandatory grant', async () => {
      const learnerMandatory = buildDefinition({ id: 'cd-lrn', scope: 'LEARNER', mandatory: true });
      const learners = [
        { id: 'l-1', firstName: 'Alice', lastName: null },
        { id: 'l-2', firstName: 'Bob', lastName: null },
      ];

      const { service } = buildService(
        {
          findFamilyLearners: jest.fn().mockResolvedValue(learners),
          findLatestRecord: jest
            .fn()
            .mockImplementation(async (_famId: string, _defId: string, learnerId?: string | null) => {
              if (learnerId === 'l-1') {
                return buildRecord({ action: 'GRANTED' });
              }
              return null; // Bob has not granted
            }),
        },
        {
          findPublished: jest.fn().mockResolvedValue([learnerMandatory]),
        },
      );

      const result = await service.checkMandatoryCompliance('fam-1');

      expect(result.compliant).toBe(false);
      expect(result.pendingMandatoryTerms).toHaveLength(1);
      expect(result.pendingMandatoryTerms[0]!.id).toBe('cd-lrn');
    });

    it('ignores non-mandatory published definitions', async () => {
      const optionalTerm = buildDefinition({ id: 'cd-opt', mandatory: false });

      const { service } = buildService(
        {
          findLatestRecord: jest.fn().mockResolvedValue(null),
        },
        {
          findPublished: jest.fn().mockResolvedValue([optionalTerm]),
        },
      );

      const result = await service.checkMandatoryCompliance('fam-1');

      expect(result.compliant).toBe(true);
      expect(result.pendingMandatoryTerms).toHaveLength(0);
    });
  });

  describe('getPublishedDefinitions', () => {
    it('delegates to consentDefsRepo.findPublished and maps to DTOs', async () => {
      const def = buildDefinition({ id: 'cd-pub', status: 'PUBLISHED' });
      const { service, consentDefsRepo } = buildService(
        {},
        { findPublished: jest.fn().mockResolvedValue([def]) },
      );

      const result = await service.getPublishedDefinitions('FAMILY');

      expect(consentDefsRepo.findPublished).toHaveBeenCalledWith('FAMILY');
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('cd-pub');
    });
  });
});
