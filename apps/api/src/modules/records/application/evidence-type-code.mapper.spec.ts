import { mapEvidenceTypeCodeToLegacyType } from './evidence-type-code.mapper.js';

describe('mapEvidenceTypeCodeToLegacyType', () => {
  it('maps every seeded EvidenceTypeDefinition base code to a legacy EvidenceType', () => {
    expect(mapEvidenceTypeCodeToLegacyType('TEXT')).toBe('TEXT');
    expect(mapEvidenceTypeCodeToLegacyType('PHOTO')).toBe('IMAGE');
    expect(mapEvidenceTypeCodeToLegacyType('VIDEO')).toBe('VIDEO');
    expect(mapEvidenceTypeCodeToLegacyType('AUDIO')).toBe('AUDIO');
    expect(mapEvidenceTypeCodeToLegacyType('FILE')).toBe('DOCUMENT');
    expect(mapEvidenceTypeCodeToLegacyType('CERTIFICATE')).toBe('CERTIFICATE');
    expect(mapEvidenceTypeCodeToLegacyType('LINK')).toBe('LINK');
    expect(mapEvidenceTypeCodeToLegacyType('OBSERVATION')).toBe('TEXT');
    expect(mapEvidenceTypeCodeToLegacyType('PROJECT')).toBe('DOCUMENT');
  });

  it('falls back to DOCUMENT for a code an admin added to the catalog that has no legacy equivalent', () => {
    expect(mapEvidenceTypeCodeToLegacyType('APIARY_INSPECTION')).toBe('DOCUMENT');
  });
});
