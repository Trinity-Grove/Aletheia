import type { EvidenceType } from '@aletheia/contracts';

// Issue #230: PortfolioItem.type is the older, closed EvidenceType enum
// (IMAGE/AUDIO/VIDEO/DOCUMENT/LINK/TEXT/CERTIFICATE); EvidenceTypeDefinition
// (the catalog EvidenceSubmission uses) is data-driven and admins can add
// new codes to it beyond the 9 seeded here without a deploy. This map
// covers the seeded base rows; an unmapped code falls back to DOCUMENT --
// safe because `type` on a promoted PortfolioItem is descriptive
// classification for filtering/display, not something that gates or
// validates the underlying file, so a generic fallback never hides or
// corrupts the actual content being promoted.
const EVIDENCE_TYPE_CODE_TO_LEGACY_TYPE: Record<string, EvidenceType> = {
  TEXT: 'TEXT',
  PHOTO: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  FILE: 'DOCUMENT',
  CERTIFICATE: 'CERTIFICATE',
  LINK: 'LINK',
  OBSERVATION: 'TEXT',
  PROJECT: 'DOCUMENT',
};

export function mapEvidenceTypeCodeToLegacyType(code: string): EvidenceType {
  return EVIDENCE_TYPE_CODE_TO_LEGACY_TYPE[code] ?? 'DOCUMENT';
}
