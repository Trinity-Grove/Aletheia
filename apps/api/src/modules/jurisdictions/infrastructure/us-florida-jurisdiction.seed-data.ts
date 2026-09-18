import type { JurisdictionComplianceMetadata } from '@aletheia/contracts';

// United States - Florida (US-FL) jurisdiction seed -- Issue #26 first deliveries
// ("Brasil como organizador/complemento; depois Uruguai e estados priorizados dos EUA").
//
// STATUTORY REFERENCES (researched 2026-09-18):
// - Florida Statutes Title XLVIII (K-20 Education Code) § 1002.41 (Home education programs).
// - Core statutory requirements:
//   1. Notice of Intent: Written notice must be filed with the district school superintendent within 30 days of establishing a home education program.
//   2. Portfolio of Records: Parents must maintain a portfolio containing a log of educational activities made contemporaneously with instruction, along with samples of writings, worksheets, workbooks, or creative materials. The portfolio must be preserved for 2 years and be available for inspection upon 15 days written notice.
//   3. Annual Educational Evaluation: An annual evaluation must be submitted to the superintendent, consisting of one of:
//      - A certified teacher review of the portfolio and discussion with the student;
//      - A nationally normed student achievement test administered by a certified teacher;
//      - A state student assessment test administered by a certified teacher;
//      - A psychological evaluation;
//      - Any other valid measurement tool mutually agreed upon.
export const US_FLORIDA_JURISDICTION_SEED: {
  code: string;
  name: string;
  description: string;
  metadata: JurisdictionComplianceMetadata;
} = {
  code: 'US-FL',
  name: 'United States - Florida',
  description:
    'State of Florida home education program requirements pursuant to Florida Statutes § 1002.41.',
  metadata: {
    minInstructionalDays: 180,
    minInstructionalHours: null,
    minLearnerAge: 6,
    maxLearnerAge: 16,
    requiredSubjects: [],
    evaluationRequirements:
      'Annual educational evaluation submitted to the county superintendent: certified teacher evaluation, nationally normed test, state student assessment test, psychological evaluation, or alternative agreed upon with the district.',
    notificationRequirements:
      'Written notice of intent filed with the district school superintendent within 30 days of establishing a home education program; written notice of termination upon completion or relocation.',
    filingDeadlines:
      'Notice of intent within 30 days of establishment; annual evaluation on or before the anniversary date of the notice of intent.',
    officialSource:
      'Florida Statutes Title XLVIII (K-20 Education Code) § 1002.41 (Home education programs).',
    sourceCheckedOn: '2026-09-18',
    confidenceLevel: 'ESTABLISHED',
    legalBasisNotes:
      'Florida requires parents to maintain a portfolio of records and materials (reading list, samples of student work) for 2 years, available for inspection by the superintendent upon 15 days written notice, and an annual educational evaluation submitted to the county. This definition does not constitute formal legal counsel.',
  },
};
