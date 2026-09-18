import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComplianceEvaluationResponseDto, ManualComplianceOverrideResponseDto } from '@aletheia/contracts';
import { ComplianceEvaluationPanel } from '../src/components/compliance/compliance-evaluation-panel';

const mockBrazilEvaluation: ComplianceEvaluationResponseDto = {
  learnerId: '22222222-2222-4222-8222-222222222222',
  learnerName: 'Alice Silva',
  academicYearId: '33333333-3333-4333-8333-333333333333',
  academicYearTitle: 'Ano Letivo 2026',
  overallStatus: 'IN_PROGRESS',
  statusSummary: 'Em Andamento: Os registros de frequência e plano curricular estão dentro do cronograma esperado.',
  jurisdiction: {
    id: '55555555-5555-4555-8555-555555555555',
    code: 'BR',
    version: 1,
    name: 'Brasil',
    confidenceLevel: 'CONTESTED',
    officialSource: 'LDB Lei 9.394/1996, Art. 24, I; STF RE 888.815',
    legalBasisNotes: 'Educacao domiciliar em zona de disputa juridica no Brasil.',
  },
  criteriaBreakdown: [
    {
      criterion: 'INSTRUCTIONAL_DAYS',
      label: 'Dias Letivos',
      status: 'IN_PROGRESS',
      currentValue: 120,
      targetValue: 200,
      explanation: 'Em andamento: 120 de 200 dias letivos registrados (60%).',
      ruleCitation: 'LDB Lei 9.394/1996, Art. 24, I',
    },
    {
      criterion: 'INSTRUCTIONAL_HOURS',
      label: 'Carga Horária',
      status: 'IN_PROGRESS',
      currentValue: 500,
      targetValue: 800,
      explanation: 'Em andamento: 500 de 800 horas registradas (63%).',
      ruleCitation: 'LDB Lei 9.394/1996, Art. 24, I',
    },
    {
      criterion: 'LEARNER_AGE',
      label: 'Faixa Etária Obrigatória',
      status: 'COMPLIANT',
      currentValue: '10 anos',
      targetValue: '4 a 17 anos',
      explanation: 'Educando tem 10 anos, dentro da faixa de escolarização obrigatória (4 a 17 anos).',
      ruleCitation: 'LDB Lei 9.394/1996',
    },
  ],
  manualOverride: null,
  legalDisclaimer:
    'O Aletheia é uma plataforma de gestão e auto-organização educacional familiar. Não substitui aconselhamento jurídico formal, fiscalização escolar ou garantia de imunidade legal perante órgãos estatais.',
  evaluatedAt: '2026-09-18T10:00:00.000Z',
};

const mockUncertainEvaluation: ComplianceEvaluationResponseDto = {
  ...mockBrazilEvaluation,
  overallStatus: 'REVIEW_NEEDED',
  statusSummary: 'Revisão Necessária: A jurisdição selecionada possui alto grau de incerteza jurídica.',
  jurisdiction: {
    id: '66666666-6666-4666-8666-666666666666',
    code: 'UY',
    version: 1,
    name: 'Uruguay',
    confidenceLevel: 'UNCERTAIN',
    officialSource: 'Ley General de Educacion N 18.437',
    legalBasisNotes: 'Incertidumbre juridica alta sobre homeschooling.',
  },
};

const mockOverriddenEvaluation: ComplianceEvaluationResponseDto = {
  ...mockBrazilEvaluation,
  overallStatus: 'EXEMPT',
  statusSummary: 'Sobreposição manual registrada por Maria Silva: "Intercâmbio cultural". Status definido como EXEMPT.',
  manualOverride: {
    id: '77777777-7777-4777-8777-777777777777',
    status: 'EXEMPT',
    reason: 'Educando participou de intercâmbio cultural com validação externa.',
    overriddenByUserId: '88888888-8888-4888-8888-888888888888',
    overriddenByName: 'Maria Silva',
    createdAt: '2026-09-18T11:00:00.000Z',
  },
};

describe('ComplianceEvaluationPanel', () => {
  const familyId = '11111111-1111-4111-8111-111111111111';
  const learnerId = '22222222-2222-4222-8222-222222222222';
  const academicYearId = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/compliance/evaluate')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBrazilEvaluation),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders select prompt when learnerId is not provided', () => {
    render(<ComplianceEvaluationPanel familyId={familyId} learnerId={null} />);

    expect(screen.getByTestId('compliance-panel-no-learner')).toBeDefined();
    expect(screen.getByText(/Selecione um educando para avaliar a conformidade/i)).toBeDefined();
  });

  it('loads and displays evaluation details, jurisdiction and criteria breakdown', async () => {
    render(
      <ComplianceEvaluationPanel
        familyId={familyId}
        learnerId={learnerId}
        academicYearId={academicYearId}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('compliance-panel-content')).toBeDefined();
    });

    expect(screen.getByText(/Brasil \(BR v1\)/i)).toBeDefined();
    expect(screen.getByText(/Em Disputa Judicial/i)).toBeDefined();
    expect(screen.getByText(/Em andamento: 120 de 200 dias letivos registrados/i)).toBeDefined();
    expect(screen.getAllByText(/LDB Lei 9.394\/1996, Art. 24, I/i).length).toBeGreaterThan(0);
    expect(screen.getByTestId('compliance-legal-disclaimer')).toBeDefined();
  });

  it('displays prominent Revisão Necessária badge for UNCERTAIN jurisdiction', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUncertainEvaluation),
      }),
    );

    render(
      <ComplianceEvaluationPanel
        familyId={familyId}
        learnerId={learnerId}
        academicYearId={academicYearId}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('compliance-panel-content')).toBeDefined();
    });

    expect(screen.getAllByText(/Revisão Necessária/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Alta Incerteza Jurídica/i)).toBeDefined();
  });

  it('displays manual override card when active override is present', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOverriddenEvaluation),
      }),
    );

    render(
      <ComplianceEvaluationPanel
        familyId={familyId}
        learnerId={learnerId}
        academicYearId={academicYearId}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('manual-override-banner')).toBeDefined();
    });

    expect(screen.getByText(/Sobreposição Manual Ativa/i)).toBeDefined();
    expect(screen.getAllByText(/Maria Silva/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Educando participou de intercâmbio cultural/i)).toBeDefined();
  });

  it('opens override modal and submits manual override', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/compliance/override') && init?.method === 'POST') {
        const overrideRes: ManualComplianceOverrideResponseDto = {
          id: 'new-override-id',
          status: 'COMPLIANT',
          reason: 'Documentação validada pelo conselho tutelar local.',
          overriddenByUserId: 'user-1',
          overriddenByName: 'Responsável Legal',
          createdAt: new Date().toISOString(),
        };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(overrideRes),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockBrazilEvaluation),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ComplianceEvaluationPanel
        familyId={familyId}
        learnerId={learnerId}
        academicYearId={academicYearId}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-override-btn')).toBeDefined();
    });

    fireEvent.click(screen.getByTestId('open-override-btn'));

    expect(screen.getByTestId('override-modal')).toBeDefined();

    const reasonInput = screen.getByTestId('override-reason-input');
    fireEvent.change(reasonInput, {
      target: { value: 'Documentação validada pelo conselho tutelar local.' },
    });

    fireEvent.click(screen.getByTestId('submit-override-btn'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/compliance/override'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Documentação validada'),
        }),
      );
    });
  });
});
