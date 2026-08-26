import { PortfolioService } from './portfolio.service.js';
import { PortfolioItemEntity } from '../domain/portfolio-item.entity.js';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let portfolioRepo: any;

  const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const LEARNER_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
  const ITEM_ID = 'p0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';

  beforeEach(() => {
    portfolioRepo = {
      create: jest.fn().mockImplementation((familyId, dto) =>
        Promise.resolve(
          new PortfolioItemEntity(
            ITEM_ID,
            familyId,
            dto.learnerId,
            dto.learningRecordId ?? null,
            dto.academicYearId ?? null,
            dto.subjectId ?? null,
            dto.title,
            dto.description ?? null,
            dto.type,
            dto.fileUrl ?? null,
            dto.textContent ?? null,
            dto.mimeType ?? null,
            dto.fileSizeBytes ?? null,
            dto.capturedAt ? new Date(dto.capturedAt) : null,
            dto.isHighlight ?? false,
            dto.tags ?? [],
            new Date(),
            new Date(),
            'Alice Smith',
            'Art',
          ),
        ),
      ),
      findById: jest.fn().mockImplementation((familyId, id) =>
        Promise.resolve(
          new PortfolioItemEntity(
            id,
            familyId,
            LEARNER_ID,
            null,
            null,
            null,
            'Drawing of Tree',
            null,
            'IMAGE',
            'https://example.com/tree.png',
            null,
            'image/png',
            1024,
            new Date('2026-08-25'),
            true,
            ['nature', 'art'],
            new Date(),
            new Date(),
            'Alice Smith',
            'Art',
          ),
        ),
      ),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockImplementation((familyId, id, dto) =>
        Promise.resolve(
          new PortfolioItemEntity(
            id,
            familyId,
            LEARNER_ID,
            null,
            null,
            null,
            dto.title ?? 'Updated Artwork',
            null,
            'IMAGE',
            null,
            null,
            null,
            null,
            null,
            dto.isHighlight ?? true,
            dto.tags ?? ['art'],
            new Date(),
            new Date(),
            'Alice Smith',
          ),
        ),
      ),
      delete: jest.fn().mockResolvedValue(true),
    };

    service = new PortfolioService(portfolioRepo);
  });

  it('creates a portfolio item successfully', async () => {
    const res = await service.createItem(FAMILY_ID, {
      learnerId: LEARNER_ID,
      title: 'Botanical Drawing',
      type: 'IMAGE',
      fileUrl: 'https://example.com/drawing.jpg',
      isHighlight: true,
      tags: ['botany', 'drawing'],
    });

    expect(res.id).toBe(ITEM_ID);
    expect(res.title).toBe('Botanical Drawing');
    expect(res.type).toBe('IMAGE');
    expect(res.isHighlight).toBe(true);
    expect(portfolioRepo.create).toHaveBeenCalledWith(FAMILY_ID, expect.objectContaining({
      title: 'Botanical Drawing',
    }));
  });

  it('retrieves a portfolio item by id', async () => {
    const res = await service.getItem(FAMILY_ID, ITEM_ID);
    expect(res.id).toBe(ITEM_ID);
    expect(res.title).toBe('Drawing of Tree');
    expect(res.capturedAt).toBe('2026-08-25');
  });

  it('throws NotFoundException when item not found by id', async () => {
    portfolioRepo.findById.mockResolvedValue(null);
    await expect(service.getItem(FAMILY_ID, 'non-existent')).rejects.toThrow('Portfolio item not found');
  });

  it('lists portfolio items with filters', async () => {
    portfolioRepo.list.mockResolvedValue([
      new PortfolioItemEntity(
        ITEM_ID,
        FAMILY_ID,
        LEARNER_ID,
        null,
        null,
        null,
        'Drawing of Tree',
        null,
        'IMAGE',
        null,
        null,
        null,
        null,
        null,
        true,
        ['art'],
        new Date(),
        new Date(),
      ),
    ]);

    const res = await service.listItems(FAMILY_ID, { isHighlight: true });
    expect(res.length).toBe(1);
    expect(portfolioRepo.list).toHaveBeenCalledWith(FAMILY_ID, { isHighlight: true });
  });

  it('updates a portfolio item', async () => {
    const res = await service.updateItem(FAMILY_ID, ITEM_ID, {
      title: 'Updated Artwork',
      isHighlight: false,
    });
    expect(res.title).toBe('Updated Artwork');
    expect(res.isHighlight).toBe(false);
  });

  it('deletes a portfolio item', async () => {
    const res = await service.deleteItem(FAMILY_ID, ITEM_ID);
    expect(res).toBe(true);
    expect(portfolioRepo.delete).toHaveBeenCalledWith(FAMILY_ID, ITEM_ID);
  });
});
