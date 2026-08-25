import { DevotionalService } from './devotional.service.js';
import { DevotionalRepository } from '../infrastructure/devotional.repository.js';
import { YouVersionService } from '../infrastructure/youversion.service.js';
import { DailyDevotionalEntity } from '../domain/daily-devotional.entity.js';
import type { UpsertDailyDevotionalDto } from '@aletheia/contracts';

describe('DevotionalService', () => {
  let devotionalService: DevotionalService;
  let fakeDevotionals: Map<string, DailyDevotionalEntity>;
  let mockYouVersionService: YouVersionService;

  beforeEach(() => {
    fakeDevotionals = new Map();

    const mockRepo = {
      upsert: async (familyId: string, dto: UpsertDailyDevotionalDto) => {
        const key = `${familyId}:${dto.date}`;
        const existing = fakeDevotionals.get(key);
        const entity = new DailyDevotionalEntity({
          id: existing ? existing.id : `devotional-${fakeDevotionals.size + 1}`,
          familyId,
          date: new Date(dto.date),
          bibleReference: dto.bibleReference,
          bibleVersionId: dto.bibleVersionId ?? null,
          passageText: dto.passageText ?? null,
          reflection: dto.reflection ?? null,
          memoryVerse: dto.memoryVerse ?? null,
          hymnOrSong: dto.hymnOrSong ?? null,
          discussionQuestions: Array.isArray(dto.discussionQuestions)
            ? JSON.stringify(dto.discussionQuestions)
            : dto.discussionQuestions ?? null,
          practicalApplication: dto.practicalApplication ?? null,
          createdAt: existing ? existing.createdAt : new Date(),
          updatedAt: new Date(),
        });
        fakeDevotionals.set(key, entity);
        return entity;
      },
      findByDate: async (familyId: string, date: Date) => {
        const dateStr = date.toISOString().slice(0, 10);
        const key = `${familyId}:${dateStr}`;
        return fakeDevotionals.get(key) ?? null;
      },
      findRecent: async (familyId: string, limit = 30) => {
        return Array.from(fakeDevotionals.values())
          .filter((d) => d.familyId === familyId)
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, limit);
      },
    } as unknown as DevotionalRepository;

    mockYouVersionService = {
      fetchPassage: async (reference: string, versionId = '3034') => {
        return {
          reference,
          versionId,
          content: 'For God so loved the world...',
          copyright: 'Berean Standard Bible',
        };
      },
      getAvailableBibles: async () => {
        return [
          { id: '3034', name: 'Berean Standard Bible', language: 'en', abbreviation: 'BSB' },
          { id: '1608', name: 'Almeida Revista e Atualizada', language: 'pt', abbreviation: 'ARA' },
        ];
      },
    } as unknown as YouVersionService;

    devotionalService = new DevotionalService(mockRepo, mockYouVersionService);
  });

  describe('upsertDevotional', () => {
    it('creates a new devotional for the family date', async () => {
      const result = await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-24',
        bibleReference: 'John 3:16',
        bibleVersionId: '3034',
        passageText: 'For God so loved the world...',
        reflection: 'God demonstrated His love.',
        memoryVerse: 'John 3:16',
        hymnOrSong: 'Amazing Grace',
        discussionQuestions: ['How does God love us?'],
        practicalApplication: 'Share love with your family today.',
      });

      expect(result.id).toBeDefined();
      expect(result.familyId).toBe('fam-1');
      expect(result.date).toBe('2026-08-24');
      expect(result.bibleReference).toBe('John 3:16');
      expect(result.bibleVersionId).toBe('3034');
      expect(result.reflection).toBe('God demonstrated His love.');
      expect(result.discussionQuestions).toBe('["How does God love us?"]');
    });

    it('updates an existing devotional on the same date for the family', async () => {
      const created = await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-24',
        bibleReference: 'John 3:16',
        reflection: 'Initial reflection',
      });

      const updated = await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-24',
        bibleReference: 'John 3:16-17',
        reflection: 'Updated reflection',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.bibleReference).toBe('John 3:16-17');
      expect(updated.reflection).toBe('Updated reflection');
    });
  });

  describe('getDevotionalByDate', () => {
    it('returns devotional when found for family and date', async () => {
      await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-24',
        bibleReference: 'Psalm 23:1',
      });

      const found = await devotionalService.getDevotionalByDate('fam-1', '2026-08-24');
      expect(found).not.toBeNull();
      expect(found?.bibleReference).toBe('Psalm 23:1');
    });

    it('returns null when no devotional exists for the date', async () => {
      const found = await devotionalService.getDevotionalByDate('fam-1', '2026-08-25');
      expect(found).toBeNull();
    });
  });

  describe('getRecentDevotionals', () => {
    it('returns recent devotionals sorted descending by date', async () => {
      await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-22',
        bibleReference: 'Psalm 1',
      });
      await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-24',
        bibleReference: 'Psalm 3',
      });
      await devotionalService.upsertDevotional('fam-1', {
        date: '2026-08-23',
        bibleReference: 'Psalm 2',
      });

      const list = await devotionalService.getRecentDevotionals('fam-1', 2);
      expect(list).toHaveLength(2);
      expect(list[0]?.date).toBe('2026-08-24');
      expect(list[1]?.date).toBe('2026-08-23');
    });
  });

  describe('lookupScripture', () => {
    it('delegates to YouVersionService', async () => {
      const passage = await devotionalService.lookupScripture('John 3:16', '3034');
      expect(passage).not.toBeNull();
      expect(passage?.reference).toBe('John 3:16');
      expect(passage?.content).toContain('For God so loved');
    });
  });

  describe('getAvailableBibles', () => {
    it('returns available Bible translations', async () => {
      const bibles = await devotionalService.getAvailableBibles();
      expect(bibles).toHaveLength(2);
      expect(bibles[0]?.abbreviation).toBe('BSB');
    });
  });
});
