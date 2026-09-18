import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReportVerificationResponseDto } from '@aletheia/contracts';
import { DocumentVerificationView } from '../src/components/reports/document-verification-view';

const mockVerifiedResponse: ReportVerificationResponseDto = {
  status: 'VERIFIED',
  documentHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  reportId: '00000000-0000-0000-0000-000000000001',
  reportType: 'ACADEMIC_TRANSCRIPT',
  title: 'Histórico Escolar Oficial - Samuel Silva 2026',
  learnerName: 'Samuel Silva',
  familyOrganizationName: 'Academia Familiar Silva',
  academicYearTitle: 'Ano Letivo 2026',
  generatedAt: '2026-08-26T12:00:00.000Z',
  legalDisclaimer:
    'Atestamos a fidelidade dos registros pedagógicos acima descritos em conformidade com as diretrizes do plano educacional familiar. Este documento comprova o histórico de atividades e avaliações realizadas no âmbito familiar através da plataforma Aletheia; não constitui salvo-conduto estatal ou atestado de não abandono intelectual emitido por autoridade pública.',
};

const mockNotFoundResponse: ReportVerificationResponseDto = {
  status: 'NOT_FOUND',
  documentHash: '0000000000000000000000000000000000000000000000000000000000000000',
  legalDisclaimer:
    'Atestamos a fidelidade dos registros pedagógicos acima descritos em conformidade com as diretrizes do plano educacional familiar. Este documento comprova o histórico de atividades e avaliações realizadas no âmbito familiar através da plataforma Aletheia; não constitui salvo-conduto estatal ou atestado de não abandono intelectual emitido por autoridade pública.',
};

const mockInvalidResponse: ReportVerificationResponseDto = {
  status: 'INVALID',
  documentHash: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  legalDisclaimer:
    'Atestamos a fidelidade dos registros pedagógicos acima descritos em conformidade com as diretrizes do plano educacional familiar. Este documento comprova o histórico de atividades e avaliações realizadas no âmbito familiar através da plataforma Aletheia; não constitui salvo-conduto estatal ou atestado de não abandono intelectual emitido por autoridade pública.',
};

describe('DocumentVerificationView', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders search input, submit button and instructions', () => {
    render(<DocumentVerificationView />);

    expect(screen.getByTestId('document-verification-title')).toBeDefined();
    expect(screen.getByTestId('verification-input')).toBeDefined();
    expect(screen.getByTestId('verify-btn')).toBeDefined();
  });

  it('verifies successfully when typing a hash and clicking verify', async () => {
    const onVerifyMock = vi.fn().mockResolvedValue(mockVerifiedResponse);

    render(<DocumentVerificationView onVerify={onVerifyMock} />);

    const input = screen.getByTestId('verification-input');
    fireEvent.change(input, {
      target: { value: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0' },
    });

    fireEvent.click(screen.getByTestId('verify-btn'));

    expect(onVerifyMock).toHaveBeenCalledWith('a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0');

    await waitFor(() => {
      expect(screen.getByTestId('verification-badge-verified')).toBeDefined();
    });

    expect(screen.getByTestId('verified-report-title').textContent).toContain('Histórico Escolar Oficial');
    expect(screen.getByTestId('verified-learner-name').textContent).toContain('Samuel Silva');
    expect(screen.getByTestId('verified-organization-name').textContent).toContain('Academia Familiar Silva');
    expect(screen.getByTestId('verified-academic-year').textContent).toContain('Ano Letivo 2026');

    // Check mandatory legal disclaimer
    const disclaimer = screen.getByTestId('verification-legal-disclaimer');
    expect(disclaimer.textContent).toContain('não constitui salvo-conduto');
    expect(disclaimer.textContent).toContain('não abandono intelectual');
  });

  it('automatically triggers verification when initialIdentifier is provided', async () => {
    const onVerifyMock = vi.fn().mockResolvedValue(mockVerifiedResponse);

    render(
      <DocumentVerificationView
        initialIdentifier="a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
        onVerify={onVerifyMock}
      />
    );

    await waitFor(() => {
      expect(onVerifyMock).toHaveBeenCalledWith('a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0');
    });

    expect(screen.getByTestId('verification-badge-verified')).toBeDefined();
  });

  it('renders NOT_FOUND badge when document does not exist', async () => {
    const onVerifyMock = vi.fn().mockResolvedValue(mockNotFoundResponse);

    render(<DocumentVerificationView onVerify={onVerifyMock} />);

    fireEvent.change(screen.getByTestId('verification-input'), {
      target: { value: 'unknown-hash-0000000000000000000000000000000000000000000000000000' },
    });
    fireEvent.click(screen.getByTestId('verify-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('verification-badge-not-found')).toBeDefined();
    });

    expect(screen.getByText(/Nenhum registro educacional oficial foi localizado/i)).toBeDefined();
  });

  it('renders INVALID badge when integrity is compromised', async () => {
    const onVerifyMock = vi.fn().mockResolvedValue(mockInvalidResponse);

    render(<DocumentVerificationView onVerify={onVerifyMock} />);

    fireEvent.change(screen.getByTestId('verification-input'), {
      target: { value: 'invalid-hash' },
    });
    fireEvent.click(screen.getByTestId('verify-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('verification-badge-invalid')).toBeDefined();
    });

    expect(screen.getByText(/Integridade do documento inválida/i)).toBeDefined();
  });
});
