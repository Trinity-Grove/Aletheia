import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PackAuthorSupportModal } from '../src/components/curriculum/pack-author-support-modal';

describe('PackAuthorSupportModal', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });
  it('renders author voluntary support details and options', () => {
    const onClose = vi.fn();
    render(
      <PackAuthorSupportModal
        isOpen={true}
        authorName="Professor Silva"
        packName="Trivium Clássico"
        pixKey="prof.silva@exemplo.com"
        onClose={onClose}
      />,
    );

    expect(screen.getByText(/Apoiar o Autor Voluntariamente/i)).toBeInTheDocument();
    expect(screen.getByText('Professor Silva')).toBeInTheDocument();
    expect(screen.getByText('prof.silva@exemplo.com')).toBeInTheDocument();
  });

  it('copies PIX key to clipboard, shows feedback, and cleans up timer on unmount', async () => {
    vi.useFakeTimers();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const onClose = vi.fn();
    const { unmount } = render(
      <PackAuthorSupportModal
        isOpen={true}
        authorName="Professor Silva"
        packName="Trivium Clássico"
        pixKey="prof.silva@exemplo.com"
        onClose={onClose}
      />,
    );

    const copyBtn = screen.getByTestId('copy-pix-btn');
    expect(copyBtn).toHaveTextContent(/Copiar Chave Pix/i);

    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(writeTextMock).toHaveBeenCalledWith('prof.silva@exemplo.com');
    expect(copyBtn).toHaveTextContent(/Copiado!/i);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(copyBtn).toHaveTextContent(/Copiar Chave Pix/i);

    // Re-click and unmount to ensure timer cleanup executes cleanly
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(copyBtn).toHaveTextContent(/Copiado!/i);

    unmount();
    vi.useRealTimers();
  });
});
