import { NotFoundException } from '@nestjs/common';
import { FamilyProjectSelectionService } from './family-project-selection.service.js';
import type { FamilyProjectSelectionRepository } from '../infrastructure/family-project-selection.repository.js';
import type { FamilyProjectSelectionWithProject } from '../infrastructure/family-project-selection.repository.js';

const FAMILY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const PROJECT_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function selection(enabled: boolean): FamilyProjectSelectionWithProject {
  return {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    familyId: FAMILY_ID,
    projectId: PROJECT_ID,
    enabled,
    createdAt: new Date('2026-10-15T00:00:00.000Z'),
    updatedAt: new Date('2026-10-15T00:00:00.000Z'),
    project: { code: 'GARDEN_BUILD', name: 'Construir uma horta', version: 1, status: 'PUBLISHED' },
  } as FamilyProjectSelectionWithProject;
}

describe('FamilyProjectSelectionService', () => {
  it('maps an explicit family preference and project metadata', async () => {
    const upsert = jest.fn().mockResolvedValue(selection(false));
    const service = new FamilyProjectSelectionService({ upsert, listByFamily: jest.fn() } as unknown as FamilyProjectSelectionRepository);

    await expect(service.upsert(FAMILY_ID, PROJECT_ID, { enabled: false })).resolves.toMatchObject({
      familyId: FAMILY_ID,
      projectId: PROJECT_ID,
      enabled: false,
      project: { code: 'GARDEN_BUILD', status: 'PUBLISHED' },
    });
    expect(upsert).toHaveBeenCalledWith(FAMILY_ID, PROJECT_ID, false);
  });

  it('rejects unpublished or missing projects', async () => {
    const upsert = jest.fn().mockResolvedValue(null);
    const service = new FamilyProjectSelectionService({ upsert, listByFamily: jest.fn() } as unknown as FamilyProjectSelectionRepository);

    await expect(service.upsert(FAMILY_ID, PROJECT_ID, { enabled: true })).rejects.toBeInstanceOf(NotFoundException);
  });
});
