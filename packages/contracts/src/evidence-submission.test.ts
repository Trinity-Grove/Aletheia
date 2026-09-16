import { describe, expect, it } from 'vitest';
import {
  createEvidenceSubmissionSchema,
  evidenceValidationStatusSchema,
  learnerSubmitEvidenceSchema,
} from './evidence-submission.js';

const LEARNER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EVIDENCE_TYPE_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12';
const COMPETENCY_ID_1 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13';
const COMPETENCY_ID_2 = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14';

describe('Evidence Submission Contracts', () => {
  it('validates a minimal text submission with one competency', () => {
    const parsed = createEvidenceSubmissionSchema.parse({
      learnerId: LEARNER_ID,
      evidenceTypeId: EVIDENCE_TYPE_ID,
      competencies: [{ competencyDefinitionId: COMPETENCY_ID_1 }],
      textContent: 'Read three chapters of Genesis and narrated back.',
    });
    expect(parsed.competencies).toHaveLength(1);
  });

  it('accepts multiple competencies -- one evidence can validate several', () => {
    const parsed = createEvidenceSubmissionSchema.parse({
      learnerId: LEARNER_ID,
      evidenceTypeId: EVIDENCE_TYPE_ID,
      competencies: [
        { competencyDefinitionId: COMPETENCY_ID_1 },
        { competencyDefinitionId: COMPETENCY_ID_2 },
      ],
      textContent: 'A project that spans two competencies.',
    });
    expect(parsed.competencies).toHaveLength(2);
  });

  it('accepts a file-based submission instead of text', () => {
    const parsed = createEvidenceSubmissionSchema.parse({
      learnerId: LEARNER_ID,
      evidenceTypeId: EVIDENCE_TYPE_ID,
      competencies: [{ competencyDefinitionId: COMPETENCY_ID_1 }],
      fileUrl: 'https://storage.example.com/evidence/abc123.jpg',
      mimeType: 'image/jpeg',
      fileSizeBytes: 204800,
    });
    expect(parsed.fileUrl).toContain('abc123.jpg');
  });

  it('rejects a submission with no text and no file', () => {
    expect(() =>
      createEvidenceSubmissionSchema.parse({
        learnerId: LEARNER_ID,
        evidenceTypeId: EVIDENCE_TYPE_ID,
        competencies: [{ competencyDefinitionId: COMPETENCY_ID_1 }],
      }),
    ).toThrow();
  });

  it('rejects a submission with zero competencies', () => {
    expect(() =>
      createEvidenceSubmissionSchema.parse({
        learnerId: LEARNER_ID,
        evidenceTypeId: EVIDENCE_TYPE_ID,
        competencies: [],
        textContent: 'orphan evidence',
      }),
    ).toThrow();
  });

  it('validation status is a closed set of three workflow states', () => {
    expect(evidenceValidationStatusSchema.parse('UNVALIDATED')).toBe('UNVALIDATED');
    expect(evidenceValidationStatusSchema.parse('VALIDATED')).toBe('VALIDATED');
    expect(evidenceValidationStatusSchema.parse('REJECTED')).toBe('REJECTED');
    expect(() => evidenceValidationStatusSchema.parse('MAYBE')).toThrow();
  });
});

// Learner-facing variant (issue #34): the whole point of this schema is
// that it structurally cannot carry a learnerId, so a learner can never
// smuggle one in through the request body of the learner-portal route.
describe('Learner Submit Evidence Contract', () => {
  it('validates a minimal text submission with no learnerId field at all', () => {
    const parsed = learnerSubmitEvidenceSchema.parse({
      evidenceTypeId: EVIDENCE_TYPE_ID,
      competencies: [{ competencyDefinitionId: COMPETENCY_ID_1 }],
      textContent: 'Read three chapters of Genesis and narrated back.',
    });
    expect(parsed).not.toHaveProperty('learnerId');
  });

  it('strips a learnerId if one is smuggled into the input -- it is not part of the schema', () => {
    const parsed = learnerSubmitEvidenceSchema.parse({
      learnerId: LEARNER_ID,
      evidenceTypeId: EVIDENCE_TYPE_ID,
      competencies: [{ competencyDefinitionId: COMPETENCY_ID_1 }],
      textContent: 'Attempting to smuggle a learnerId.',
    });
    expect(parsed).not.toHaveProperty('learnerId');
  });

  it('rejects a submission with no text and no file, same as the guardian schema', () => {
    expect(() =>
      learnerSubmitEvidenceSchema.parse({
        evidenceTypeId: EVIDENCE_TYPE_ID,
        competencies: [{ competencyDefinitionId: COMPETENCY_ID_1 }],
      }),
    ).toThrow();
  });

  it('rejects a submission with zero competencies, same as the guardian schema', () => {
    expect(() =>
      learnerSubmitEvidenceSchema.parse({
        evidenceTypeId: EVIDENCE_TYPE_ID,
        competencies: [],
        textContent: 'orphan evidence',
      }),
    ).toThrow();
  });
});
