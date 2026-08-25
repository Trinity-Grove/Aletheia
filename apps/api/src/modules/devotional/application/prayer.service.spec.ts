import { NotFoundException } from '@nestjs/common';
import { PrayerService } from './prayer.service.js';
import { PrayerRepository } from '../infrastructure/prayer.repository.js';
import { PrayerRequestEntity } from '../domain/prayer-request.entity.js';
import type { CreatePrayerDto, UpdatePrayerDto } from '@aletheia/contracts';

describe('PrayerService', () => {
  let prayerService: PrayerService;
  let fakePrayers: Map<string, PrayerRequestEntity>;

  beforeEach(() => {
    fakePrayers = new Map();

    const mockRepo = {
      create: async (familyId: string, dto: CreatePrayerDto) => {
        const id = `prayer-${fakePrayers.size + 1}`;
        const entity = new PrayerRequestEntity({
          id,
          familyId,
          learnerId: dto.learnerId ?? null,
          type: dto.type ?? 'PETITION',
          title: dto.title,
          description: dto.description ?? null,
          isAnswered: false,
          answeredAt: null,
          answeredNote: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        fakePrayers.set(id, entity);
        return entity;
      },
      findByFamilyId: async (
        familyId: string,
        filter?: { isAnswered?: boolean; includeArchived?: boolean },
      ) => {
        return Array.from(fakePrayers.values())
          .filter((p) => p.familyId === familyId)
          .filter((p) => (filter?.isAnswered !== undefined ? p.isAnswered === filter.isAnswered : true))
          .filter((p) => (filter?.includeArchived ? true : !p.isArchived))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      },
      findByIdAndFamilyId: async (familyId: string, id: string) => {
        const entity = fakePrayers.get(id);
        if (!entity || entity.familyId !== familyId) {
          return null;
        }
        return entity;
      },
      update: async (
        familyId: string,
        id: string,
        data: Partial<UpdatePrayerDto> & {
          isAnswered?: boolean;
          answeredAt?: Date | null;
          answeredNote?: string | null;
          archivedAt?: Date | null;
        },
      ) => {
        const existing = fakePrayers.get(id);
        if (!existing || existing.familyId !== familyId) {
          return null;
        }

        const updated = new PrayerRequestEntity({
          id: existing.id,
          familyId: existing.familyId,
          learnerId: data.learnerId !== undefined ? (data.learnerId || null) : existing.learnerId,
          type: data.type ?? existing.type,
          title: data.title ?? existing.title,
          description: data.description !== undefined ? (data.description || null) : existing.description,
          isAnswered: data.isAnswered !== undefined ? data.isAnswered : existing.isAnswered,
          answeredAt: data.answeredAt !== undefined ? data.answeredAt : existing.answeredAt,
          answeredNote: data.answeredNote !== undefined ? (data.answeredNote || null) : existing.answeredNote,
          archivedAt: data.archivedAt !== undefined ? data.archivedAt : existing.archivedAt,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
        });
        fakePrayers.set(id, updated);
        return updated;
      },
    } as unknown as PrayerRepository;

    prayerService = new PrayerService(mockRepo);
  });

  describe('createPrayer', () => {
    it('creates a new prayer request', async () => {
      const result = await prayerService.createPrayer('fam-1', {
        title: 'Healing for Grandma',
        description: 'Pray for swift recovery',
        type: 'PETITION',
      });

      expect(result.id).toBeDefined();
      expect(result.familyId).toBe('fam-1');
      expect(result.title).toBe('Healing for Grandma');
      expect(result.type).toBe('PETITION');
      expect(result.isAnswered).toBe(false);
      expect(result.answeredAt).toBeNull();
      expect(result.archivedAt).toBeNull();
    });
  });

  describe('getFamilyPrayers', () => {
    it('returns family prayer requests filtered by answered status', async () => {
      const p1 = await prayerService.createPrayer('fam-1', {
        title: 'Health',
      });
      const p2 = await prayerService.createPrayer('fam-1', {
        title: 'Gratitude for provision',
        type: 'GRATITUDE',
      });

      await prayerService.answerPrayer('fam-1', p2.id, { answeredNote: 'Provided!' });

      const pending = await prayerService.getFamilyPrayers('fam-1', { isAnswered: false });
      expect(pending).toHaveLength(1);
      expect(pending[0]?.id).toBe(p1.id);

      const answered = await prayerService.getFamilyPrayers('fam-1', { isAnswered: true });
      expect(answered).toHaveLength(1);
      expect(answered[0]?.id).toBe(p2.id);
    });

    it('filters out archived prayers unless requested', async () => {
      const p1 = await prayerService.createPrayer('fam-1', { title: 'Pray 1' });
      await prayerService.archivePrayer('fam-1', p1.id);

      const active = await prayerService.getFamilyPrayers('fam-1');
      expect(active).toHaveLength(0);

      const all = await prayerService.getFamilyPrayers('fam-1', { includeArchived: true });
      expect(all).toHaveLength(1);
      expect(all[0]?.id).toBe(p1.id);
    });
  });

  describe('answerPrayer', () => {
    it('marks a prayer request as answered with note and timestamp', async () => {
      const created = await prayerService.createPrayer('fam-1', {
        title: 'New job opportunity',
      });

      const answered = await prayerService.answerPrayer('fam-1', created.id, {
        answeredNote: 'Accepted an offer today!',
      });

      expect(answered.id).toBe(created.id);
      expect(answered.isAnswered).toBe(true);
      expect(answered.answeredAt).not.toBeNull();
      expect(answered.answeredNote).toBe('Accepted an offer today!');
    });

    it('throws NotFoundException if prayer is not found', async () => {
      await expect(
        prayerService.answerPrayer('fam-1', 'non-existent', { answeredNote: 'note' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archivePrayer', () => {
    it('archives a prayer request', async () => {
      const created = await prayerService.createPrayer('fam-1', {
        title: 'Safe travels',
      });

      const archived = await prayerService.archivePrayer('fam-1', created.id);
      expect(archived.id).toBe(created.id);
      expect(archived.archivedAt).not.toBeNull();
    });

    it('throws NotFoundException when archiving non-existent prayer', async () => {
      await expect(prayerService.archivePrayer('fam-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePrayer', () => {
    it('updates prayer details', async () => {
      const created = await prayerService.createPrayer('fam-1', {
        title: 'Initial Title',
      });

      const updated = await prayerService.updatePrayer('fam-1', created.id, {
        title: 'Updated Title',
        description: 'Added description',
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Added description');
    });

    it('throws NotFoundException when updating non-existent prayer', async () => {
      await expect(
        prayerService.updatePrayer('fam-1', 'missing', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPrayerById', () => {
    it('returns prayer when found', async () => {
      const created = await prayerService.createPrayer('fam-1', {
        title: 'Test',
      });

      const found = await prayerService.getPrayerById('fam-1', created.id);
      expect(found.id).toBe(created.id);
      expect(found.title).toBe('Test');
    });

    it('throws NotFoundException when not found or belongs to another family', async () => {
      const created = await prayerService.createPrayer('fam-1', {
        title: 'Test',
      });

      await expect(prayerService.getPrayerById('fam-2', created.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
