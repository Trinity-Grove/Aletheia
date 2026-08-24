import { NotFoundException } from '@nestjs/common';
import { LearnerService } from './learner.service.js';
import { LearnerRepository } from '../infrastructure/learner.repository.js';
import { LearnerEntity } from '../domain/learner.entity.js';
import type { CreateLearnerDto, UpdateLearnerDto } from '@aletheia/contracts';

describe('LearnerService', () => {
  let learnerService: LearnerService;
  let fakeLearners: Map<string, LearnerEntity>;

  beforeEach(() => {
    fakeLearners = new Map();

    const mockRepo = {
      create: async (familyId: string, dto: CreateLearnerDto) => {
        const id = `learner-${fakeLearners.size + 1}`;
        const entity = new LearnerEntity({
          id,
          familyId,
          firstName: dto.firstName,
          lastName: dto.lastName ?? null,
          preferredName: dto.preferredName ?? null,
          birthDate: new Date(dto.birthDate),
          stage: dto.stage ?? 'PRIMARY_GRAMMAR',
          customGrade: dto.customGrade ?? null,
          avatarColor: dto.avatarColor ?? null,
          specialNeeds: dto.specialNeeds ?? null,
          notes: dto.notes ?? null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        fakeLearners.set(id, entity);
        return entity;
      },
      findByFamilyId: async (familyId: string, includeArchived = false) => {
        return Array.from(fakeLearners.values())
          .filter((l) => l.familyId === familyId)
          .filter((l) => (includeArchived ? true : !l.isArchived))
          .sort((a, b) => a.birthDate.getTime() - b.birthDate.getTime());
      },
      findByIdAndFamilyId: async (familyId: string, id: string) => {
        const entity = fakeLearners.get(id);
        if (!entity || entity.familyId !== familyId) {
          return null;
        }
        return entity;
      },
      update: async (
        familyId: string,
        id: string,
        data: Partial<UpdateLearnerDto> & { archivedAt?: Date | null },
      ) => {
        const existing = fakeLearners.get(id);
        if (!existing || existing.familyId !== familyId) {
          return null;
        }

        const updated = new LearnerEntity({
          id: existing.id,
          familyId: existing.familyId,
          firstName: data.firstName ?? existing.firstName,
          lastName: data.lastName !== undefined ? data.lastName : existing.lastName,
          preferredName: data.preferredName !== undefined ? data.preferredName : existing.preferredName,
          birthDate: data.birthDate ? new Date(data.birthDate) : existing.birthDate,
          stage: data.stage ?? existing.stage,
          customGrade: data.customGrade !== undefined ? data.customGrade : existing.customGrade,
          avatarColor: data.avatarColor !== undefined ? data.avatarColor : existing.avatarColor,
          specialNeeds: data.specialNeeds !== undefined ? data.specialNeeds : existing.specialNeeds,
          notes: data.notes !== undefined ? data.notes : existing.notes,
          archivedAt: data.archivedAt !== undefined ? data.archivedAt : existing.archivedAt,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        });
        fakeLearners.set(id, updated);
        return updated;
      },
    } as unknown as LearnerRepository;

    learnerService = new LearnerService(mockRepo);
  });

  describe('createLearner', () => {
    it('creates a learner for the given family', async () => {
      const result = await learnerService.createLearner('fam-1', {
        firstName: 'Lucas',
        lastName: 'Silva',
        birthDate: '2016-05-12',
        stage: 'PRIMARY_GRAMMAR',
      });

      expect(result.id).toBeDefined();
      expect(result.familyId).toBe('fam-1');
      expect(result.firstName).toBe('Lucas');
      expect(result.lastName).toBe('Silva');
      expect(result.birthDate).toBe('2016-05-12');
      expect(result.stage).toBe('PRIMARY_GRAMMAR');
      expect(result.archivedAt).toBeNull();
    });
  });

  describe('getFamilyLearners', () => {
    it('returns active learners sorted by birthDate', async () => {
      await learnerService.createLearner('fam-1', {
        firstName: 'Older Child',
        birthDate: '2012-01-01',
        stage: 'PRIMARY_GRAMMAR',
      });
      await learnerService.createLearner('fam-1', {
        firstName: 'Younger Child',
        birthDate: '2018-06-01',
        stage: 'EARLY_YEARS',
      });

      const learners = await learnerService.getFamilyLearners('fam-1');
      expect(learners).toHaveLength(2);
      expect(learners[0]?.firstName).toBe('Older Child');
      expect(learners[1]?.firstName).toBe('Younger Child');
    });

    it('excludes archived learners by default', async () => {
      const created = await learnerService.createLearner('fam-1', {
        firstName: 'Archived Child',
        birthDate: '2014-01-01',
        stage: 'PRIMARY_GRAMMAR',
      });
      await learnerService.archiveLearner('fam-1', created.id);

      const active = await learnerService.getFamilyLearners('fam-1');
      expect(active).toHaveLength(0);

      const all = await learnerService.getFamilyLearners('fam-1', true);
      expect(all).toHaveLength(1);
      expect(all[0]?.id).toBe(created.id);
    });
  });

  describe('getLearnerById', () => {
    it('returns learner when found in family', async () => {
      const created = await learnerService.createLearner('fam-1', {
        firstName: 'Ana',
        birthDate: '2015-08-20',
        stage: 'PRIMARY_GRAMMAR',
      });

      const found = await learnerService.getLearnerById('fam-1', created.id);
      expect(found.id).toBe(created.id);
      expect(found.firstName).toBe('Ana');
    });

    it('throws NotFoundException when learner does not exist or belongs to another family', async () => {
      await expect(learnerService.getLearnerById('fam-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );

      const created = await learnerService.createLearner('fam-1', {
        firstName: 'Ana',
        birthDate: '2015-08-20',
        stage: 'PRIMARY_GRAMMAR',
      });
      await expect(learnerService.getLearnerById('fam-2', created.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateLearner', () => {
    it('updates learner details', async () => {
      const created = await learnerService.createLearner('fam-1', {
        firstName: 'Pedro',
        birthDate: '2017-03-10',
        stage: 'PRIMARY_GRAMMAR',
      });

      const updated = await learnerService.updateLearner('fam-1', created.id, {
        firstName: 'Pedro Henrique',
        stage: 'MIDDLE_LOGIC',
      });

      expect(updated.firstName).toBe('Pedro Henrique');
      expect(updated.stage).toBe('MIDDLE_LOGIC');
    });

    it('throws NotFoundException if learner not found for update', async () => {
      await expect(
        learnerService.updateLearner('fam-1', 'non-existent', { firstName: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archiveLearner & reactivateLearner', () => {
    it('archives learner setting archivedAt timestamp', async () => {
      const created = await learnerService.createLearner('fam-1', {
        firstName: 'Lucas',
        birthDate: '2016-05-12',
        stage: 'PRIMARY_GRAMMAR',
      });

      const archived = await learnerService.archiveLearner('fam-1', created.id);
      expect(archived.archivedAt).not.toBeNull();

      const reactivated = await learnerService.reactivateLearner('fam-1', created.id);
      expect(reactivated.archivedAt).toBeNull();
    });

    it('throws NotFoundException on archive/reactivate for non-existent learner', async () => {
      await expect(learnerService.archiveLearner('fam-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
      await expect(learnerService.reactivateLearner('fam-1', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
