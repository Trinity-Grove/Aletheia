import type { JurisdictionComplianceMetadata } from '@aletheia/contracts';

// United States - Texas (US-TX) jurisdiction seed -- Issue #26 first deliveries
// ("Brasil como organizador/complemento; depois Uruguai e estados priorizados dos EUA").
//
// STATUTORY REFERENCES (researched 2026-09-18):
// - Texas Supreme Court Landmark Ruling: Leeper v. Arlington ISD, 843 S.W.2d 41 (Tex. 1987),
//   confirmed that homeschools qualify as private schools under Texas law.
// - Texas Education Code § 25.086(a)(1): Exemption from compulsory attendance for children attending
//   a private or parochial school.
// - Core legal requirements for lawful homeschool operation in Texas:
//   1. The instruction must be bona fide (not a sham).
//   2. The curriculum must be visual in nature (such as books, workbooks, or computer screens).
//   3. The curriculum must cover the five basic subjects: reading, spelling, grammar, mathematics, and good citizenship.
// - Texas mandates no minimum hours per day or days per year, no teacher credentials, no state testing,
//   and no registration with the state or local school district.
export const US_TEXAS_JURISDICTION_SEED: {
  code: string;
  name: string;
  description: string;
  metadata: JurisdictionComplianceMetadata;
} = {
  code: 'US-TX',
  name: 'United States - Texas',
  description:
    'State of Texas homeschool requirements pursuant to Texas Education Code § 25.086 and Leeper v. Arlington ISD (1987).',
  metadata: {
    minInstructionalDays: null,
    minInstructionalHours: null,
    minLearnerAge: 6,
    maxLearnerAge: 19,
    requiredSubjects: [
      'reading',
      'spelling',
      'grammar',
      'mathematics',
      'good_citizenship',
    ],
    evaluationRequirements:
      'No state-mandated standardized testing or annual assessment required under Texas law.',
    notificationRequirements:
      'No annual notice of intent or state registration required (formal withdrawal letter recommended only when withdrawing from a public school).',
    filingDeadlines: null,
    officialSource:
      'Texas Education Code § 25.086(a)(1); Texas Supreme Court Leeper v. Arlington ISD, 843 S.W.2d 41 (Tex. 1987).',
    sourceCheckedOn: '2026-09-18',
    confidenceLevel: 'ESTABLISHED',
    legalBasisNotes:
      'In Texas, homeschools are treated as unaccredited private schools. To be lawful, instruction must be bona fide, visual in nature, and teach reading, spelling, grammar, mathematics, and good citizenship. Parents are free to determine graduation requirements and issue transcripts/diplomas. This definition does not constitute formal legal counsel.',
  },
};
