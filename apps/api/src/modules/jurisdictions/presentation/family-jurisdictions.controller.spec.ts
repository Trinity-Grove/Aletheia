import { FamilyJurisdictionsController } from './family-jurisdictions.controller.js';
import type { JurisdictionDefinitionsService } from '../application/jurisdiction-definitions.service.js';
import type { FamilyJurisdictionResponseDto } from '@aletheia/contracts';

describe('FamilyJurisdictionsController', () => {
  let controller: FamilyJurisdictionsController;
  let service: jest.Mocked<JurisdictionDefinitionsService>;

  const mockResponse: FamilyJurisdictionResponseDto = {
    code: 'BR',
    name: 'Brasil (Referencial Nacional)',
    version: 1,
    confidenceLevel: 'ESTABLISHED',
    minInstructionalDays: 200,
    minInstructionalHours: 800,
    officialSource: 'Lei 9.394/1996',
    legalBasisSummary: 'Liberdade constitucional da família.',
  };

  beforeEach(() => {
    service = {
      getFamilyJurisdiction: jest.fn().mockResolvedValue(mockResponse),
    } as unknown as jest.Mocked<JurisdictionDefinitionsService>;

    controller = new FamilyJurisdictionsController(service);
  });

  it('delegates to service.getFamilyJurisdiction with familyId param', async () => {
    const familyId = 'family-uuid-123';
    const result = await controller.getFamilyJurisdiction(familyId);

    expect(service.getFamilyJurisdiction).toHaveBeenCalledWith(familyId);
    expect(result).toEqual(mockResponse);
  });
});
