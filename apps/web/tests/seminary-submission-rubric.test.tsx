import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  SEMINARY_DISCIPLINES_METADATA,
  SEMINARY_THEOLOGY_RUBRIC_DEFINITION,
} from '@aletheia/contracts';
import { LocaleProvider } from '../src/lib/i18n/locale-context';
import {
  SeminaryPaperSubmissionModal,
  type SeminaryPaperSubmissionData,
} from '../src/components/curriculum/seminary-paper-submission-modal';
import {
  TheologyRubricEvaluator,
  type SeminaryEvaluationResult,
} from '../src/components/curriculum/theology-rubric-evaluator';
import { SeminaryModuleViewer } from '../src/components/curriculum/seminary-module-viewer';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mockDisciplineBibliology = SEMINARY_DISCIPLINES_METADATA[0]!; // THEO.ADV.BIBLIOLOGY_CANON (Cycle 1)
const mockDisciplineExegesis = SEMINARY_DISCIPLINES_METADATA[2]!; // THEO.ADV.STRUCTURED_EXEGESIS (Cycle 1)

describe('Task 4: SeminaryPaperSubmissionModal & TheologyRubricEvaluator', () => {
  describe('SeminaryPaperSubmissionModal', () => {
    it('does not render modal when isOpen is false', () => {
      render(
        <LocaleProvider>
          <SeminaryPaperSubmissionModal
            isOpen={false}
            onClose={vi.fn()}
            discipline={mockDisciplineBibliology}
            onSubmit={vi.fn()}
          />
        </LocaleProvider>
      );

      expect(screen.queryByTestId('paper-title-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('save-paper-submission-btn')).not.toBeInTheDocument();
    });

    it('renders modal with discipline information and defaults evidence type to suggested type', () => {
      render(
        <LocaleProvider>
          <SeminaryPaperSubmissionModal
            isOpen={true}
            onClose={vi.fn()}
            discipline={mockDisciplineExegesis}
            onSubmit={vi.fn()}
          />
        </LocaleProvider>
      );

      expect(screen.getByText(mockDisciplineExegesis.name)).toBeInTheDocument();
      const select = screen.getByTestId('evidence-type-select') as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      // mockDisciplineExegesis has suggestedEvidenceTypes: ['EXEGESIS_PAPER', 'ORAL_DEFENSE']
      expect(select.value).toBe('EXEGESIS_PAPER');
    });

    it('disables submit button when title or text content is empty', () => {
      render(
        <LocaleProvider>
          <SeminaryPaperSubmissionModal
            isOpen={true}
            onClose={vi.fn()}
            discipline={mockDisciplineBibliology}
            onSubmit={vi.fn()}
          />
        </LocaleProvider>
      );

      const submitBtn = screen.getByTestId('save-paper-submission-btn');
      expect(submitBtn).toBeDisabled();

      // Enter only title
      fireEvent.change(screen.getByTestId('paper-title-input'), {
        target: { value: 'Ensaio sobre a Inerrância Bíblica' },
      });
      expect(submitBtn).toBeDisabled();

      // Enter content as well
      fireEvent.change(screen.getByTestId('paper-content-textarea'), {
        target: { value: 'Neste ensaio teológico analisamos a doutrina da inerrância...' },
      });
      expect(submitBtn).not.toBeDisabled();

      // Clear title again
      fireEvent.change(screen.getByTestId('paper-title-input'), {
        target: { value: '   ' },
      });
      expect(submitBtn).toBeDisabled();
    });

    it('submits form with valid data including evidence type, title, content and fileUrl', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <LocaleProvider>
          <SeminaryPaperSubmissionModal
            isOpen={true}
            onClose={onClose}
            discipline={mockDisciplineBibliology}
            onSubmit={onSubmit}
          />
        </LocaleProvider>
      );

      // Select evidence type
      fireEvent.change(screen.getByTestId('evidence-type-select'), {
        target: { value: 'BOOK_REVIEW' },
      });

      // Fill title
      fireEvent.change(screen.getByTestId('paper-title-input'), {
        target: { value: 'Resenha Crítica: The Inspiration and Authority of the Bible' },
      });

      // Fill content
      fireEvent.change(screen.getByTestId('paper-content-textarea'), {
        target: { value: 'Uma análise exaustiva da tese de B.B. Warfield...' },
      });

      // Fill file URL
      fireEvent.change(screen.getByTestId('paper-file-url-input'), {
        target: { value: 'https://aletheia.edu/papers/warfield-review.pdf' },
      });

      // Click submit
      fireEvent.click(screen.getByTestId('save-paper-submission-btn'));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      expect(onSubmit).toHaveBeenCalledWith({
        disciplineCode: mockDisciplineBibliology.code,
        evidenceTypeCode: 'BOOK_REVIEW',
        title: 'Resenha Crítica: The Inspiration and Authority of the Bible',
        textContent: 'Uma análise exaustiva da tese de B.B. Warfield...',
        fileUrl: 'https://aletheia.edu/papers/warfield-review.pdf',
      } satisfies SeminaryPaperSubmissionData);

      expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose when cancel button is clicked', () => {
      const onClose = vi.fn();

      render(
        <LocaleProvider>
          <SeminaryPaperSubmissionModal
            isOpen={true}
            onClose={onClose}
            discipline={mockDisciplineBibliology}
            onSubmit={vi.fn()}
          />
        </LocaleProvider>
      );

      fireEvent.click(screen.getByTestId('cancel-paper-submission-btn'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders error message in paper-submission-error when onSubmit fails', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Erro de rede ao salvar submissão'));

      render(
        <LocaleProvider>
          <SeminaryPaperSubmissionModal
            isOpen={true}
            onClose={vi.fn()}
            discipline={mockDisciplineBibliology}
            onSubmit={onSubmit}
          />
        </LocaleProvider>
      );

      fireEvent.change(screen.getByTestId('paper-title-input'), {
        target: { value: 'Ensaio de Teste' },
      });
      fireEvent.change(screen.getByTestId('paper-content-textarea'), {
        target: { value: 'Conteúdo de Teste do Ensaio' },
      });

      fireEvent.click(screen.getByTestId('save-paper-submission-btn'));

      await waitFor(() => {
        const errorAlert = screen.getByTestId('paper-submission-error');
        expect(errorAlert).toBeInTheDocument();
        expect(errorAlert).toHaveTextContent(/Erro de rede ao salvar submissão/i);
      });
    });
  });

  describe('TheologyRubricEvaluator', () => {
    it('renders all 4 criteria with names and weights', () => {
      render(
        <LocaleProvider>
          <TheologyRubricEvaluator onSaveEvaluation={vi.fn()} />
        </LocaleProvider>
      );

      for (const criterion of SEMINARY_THEOLOGY_RUBRIC_DEFINITION.criteria) {
        expect(screen.getByText(criterion.name)).toBeInTheDocument();
        // Weights: 30%, 25%, 25%, 20%
        expect(
          screen.getAllByText(new RegExp(`${Math.round(criterion.weight * 100)}%`)).length
        ).toBeGreaterThanOrEqual(1);

        for (let level = 1; level <= 4; level++) {
          expect(
            screen.getByTestId(`criterion-level-${criterion.code}-${level}`)
          ).toBeInTheDocument();
        }
      }

      expect(screen.getByTestId('weighted-score-display')).toBeInTheDocument();
      expect(screen.getByTestId('portfolio-checkbox')).toBeInTheDocument();
      expect(screen.getByTestId('evaluation-notes')).toBeInTheDocument();
      expect(screen.getByTestId('save-evaluation-btn')).toBeInTheDocument();
    });

    it('calculates weighted score accurately when levels are selected', () => {
      render(
        <LocaleProvider>
          <TheologyRubricEvaluator onSaveEvaluation={vi.fn()} />
        </LocaleProvider>
      );

      // Select level 4 for all 4 criteria:
      // sum(weight * 4) = 4.0 * 2.5 = 10.0
      fireEvent.click(screen.getByTestId('criterion-level-EXEGETICAL_DEPTH-4'));
      fireEvent.click(screen.getByTestId('criterion-level-SYSTEMATIC_COHERENCE-4'));
      fireEvent.click(screen.getByTestId('criterion-level-HISTORICAL_AWARENESS-4'));
      fireEvent.click(screen.getByTestId('criterion-level-ARGUMENTATIVE_RIGOR-4'));

      expect(screen.getByTestId('weighted-score-display')).toHaveTextContent('10.0');

      // Select level 3 for all 4 criteria:
      // sum(weight * 3) = 3.0 * 2.5 = 7.5
      fireEvent.click(screen.getByTestId('criterion-level-EXEGETICAL_DEPTH-3'));
      fireEvent.click(screen.getByTestId('criterion-level-SYSTEMATIC_COHERENCE-3'));
      fireEvent.click(screen.getByTestId('criterion-level-HISTORICAL_AWARENESS-3'));
      fireEvent.click(screen.getByTestId('criterion-level-ARGUMENTATIVE_RIGOR-3'));

      expect(screen.getByTestId('weighted-score-display')).toHaveTextContent('7.5');

      // Custom distribution:
      // EXEGETICAL_DEPTH (0.3): level 4 (1.2)
      // SYSTEMATIC_COHERENCE (0.25): level 3 (0.75)
      // HISTORICAL_AWARENESS (0.25): level 3 (0.75)
      // ARGUMENTATIVE_RIGOR (0.2): level 2 (0.4)
      // sum = 1.2 + 0.75 + 0.75 + 0.4 = 3.1
      // weighted score = 3.1 * 2.5 = 7.75 -> 7.8
      fireEvent.click(screen.getByTestId('criterion-level-EXEGETICAL_DEPTH-4'));
      fireEvent.click(screen.getByTestId('criterion-level-ARGUMENTATIVE_RIGOR-2'));

      expect(screen.getByTestId('weighted-score-display')).toHaveTextContent('7.8');
    });

    it('emits SeminaryEvaluationResult when save evaluation button is clicked', async () => {
      const onSaveEvaluation = vi.fn();

      render(
        <LocaleProvider>
          <TheologyRubricEvaluator onSaveEvaluation={onSaveEvaluation} />
        </LocaleProvider>
      );

      // Select levels: all 4s
      fireEvent.click(screen.getByTestId('criterion-level-EXEGETICAL_DEPTH-4'));
      fireEvent.click(screen.getByTestId('criterion-level-SYSTEMATIC_COHERENCE-4'));
      fireEvent.click(screen.getByTestId('criterion-level-HISTORICAL_AWARENESS-4'));
      fireEvent.click(screen.getByTestId('criterion-level-ARGUMENTATIVE_RIGOR-4'));

      // Check portfolio inclusion
      const portfolioCheck = screen.getByTestId('portfolio-checkbox');
      fireEvent.click(portfolioCheck);

      // Fill notes
      fireEvent.change(screen.getByTestId('evaluation-notes'), {
        target: { value: 'Trabalho teológico com exegese exemplar e erudição histórica.' },
      });

      // Click save
      fireEvent.click(screen.getByTestId('save-evaluation-btn'));

      expect(onSaveEvaluation).toHaveBeenCalledTimes(1);
      const expectedResult: SeminaryEvaluationResult = {
        scores: [
          { criterionCode: 'EXEGETICAL_DEPTH', score: 4, weight: 0.3 },
          { criterionCode: 'SYSTEMATIC_COHERENCE', score: 4, weight: 0.25 },
          { criterionCode: 'HISTORICAL_AWARENESS', score: 4, weight: 0.25 },
          { criterionCode: 'ARGUMENTATIVE_RIGOR', score: 4, weight: 0.2 },
        ],
        weightedScore: 10.0,
        notes: 'Trabalho teológico com exegese exemplar e erudição histórica.',
        includeInPortfolio: true,
      };

      expect(onSaveEvaluation).toHaveBeenCalledWith(expectedResult);
    });

    it('handles readOnly mode by disabling controls and hiding or disabling save button', () => {
      render(
        <LocaleProvider>
          <TheologyRubricEvaluator onSaveEvaluation={vi.fn()} readOnly={true} />
        </LocaleProvider>
      );

      const levelBtn = screen.getByTestId('criterion-level-EXEGETICAL_DEPTH-4');
      expect(levelBtn).toBeDisabled();

      const notes = screen.getByTestId('evaluation-notes');
      expect(notes).toBeDisabled();

      const portfolioCheck = screen.getByTestId('portfolio-checkbox');
      expect(portfolioCheck).toBeDisabled();

      const saveBtn = screen.queryByTestId('save-evaluation-btn');
      if (saveBtn) {
        expect(saveBtn).toBeDisabled();
      }
    });
  });

  describe('Integration in SeminaryModuleViewer', () => {
    it('opens SeminaryPaperSubmissionModal when submit-paper-btn is clicked', () => {
      const onSelectEvidenceSubmission = vi.fn();

      render(
        <LocaleProvider>
          <SeminaryModuleViewer
            preferredTraditionCode="REFORMED"
            onSelectEvidenceSubmission={onSelectEvidenceSubmission}
          />
        </LocaleProvider>
      );

      // Verify modal is initially closed
      expect(screen.queryByTestId('paper-title-input')).not.toBeInTheDocument();

      // Click submit paper button
      const submitBtn = screen.getByTestId('submit-paper-btn');
      fireEvent.click(submitBtn);

      // Modal is now open
      expect(screen.getByTestId('paper-title-input')).toBeInTheDocument();
      expect(screen.getByTestId('paper-content-textarea')).toBeInTheDocument();

      // Both modal opened and callback was triggered
      expect(onSelectEvidenceSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'THEO.ADV.BIBLIOLOGY_CANON',
        })
      );

      // Close modal
      fireEvent.click(screen.getByTestId('cancel-paper-submission-btn'));
      expect(screen.queryByTestId('paper-title-input')).not.toBeInTheDocument();
    });
  });
});
