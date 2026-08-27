import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { Modal } from '../src/index.js';

describe('Modal A11y & Focus Management', () => {
  afterEach(cleanup);

  it('renders with role="dialog", aria-modal="true", and connects aria-labelledby', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        title="Planejamento de Lição"
        description="Configure os detalhes"
      >
        <p>Conteúdo do modal</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Planejamento de Lição');
    expect(screen.getByTestId('modal-description')).toHaveTextContent('Configure os detalhes');
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Teste Escape">
        <button type="button">Botão interno</button>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the close icon button', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Fechar">
        <p>Conteúdo</p>
      </Modal>
    );

    const closeBtn = screen.getByTestId('modal-close-button');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('traps focus inside the modal when Tab is pressed', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Focus Trap">
        <input data-testid="input-1" type="text" />
        <input data-testid="input-2" type="text" />
      </Modal>
    );

    const input2 = screen.getByTestId('input-2');
    const closeBtn = screen.getByTestId('modal-close-button');

    // Focus last element (input2)
    input2.focus();
    expect(document.activeElement).toBe(input2);

    // Press Tab on last element -> wraps to closeBtn
    fireEvent.keyDown(document, { key: 'Tab' });

    // Press Shift+Tab on first element -> wraps to last element
    closeBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Invisível">
        <p>Não deve aparecer</p>
      </Modal>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
