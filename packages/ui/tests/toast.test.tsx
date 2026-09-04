import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { ToastProvider, useToast } from '../src/components/toast.js';

function ToastTrigger() {
  const { toast } = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast({ variant: 'success', title: 'Salvo com sucesso' })}>
        trigger-success
      </button>
      <button
        type="button"
        onClick={() => toast({ variant: 'error', title: 'Falha ao salvar', description: 'Tente novamente' })}
      >
        trigger-error
      </button>
      <button type="button" onClick={() => toast({ variant: 'info', title: 'Persistente', duration: 0 })}>
        trigger-persistent
      </button>
    </div>
  );
}

describe('Toast', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('throws when useToast is used outside a ToastProvider', () => {
    function Bare() {
      useToast();
      return null;
    }
    expect(() => render(<Bare />)).toThrow('useToast must be used within a ToastProvider.');
  });

  it('renders a success toast with role="status" and aria-live="polite"', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));

    const toastEl = screen.getByTestId('toast');
    expect(toastEl).toHaveAttribute('role', 'status');
    expect(toastEl).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Salvo com sucesso');
  });

  it('renders an error toast with role="alert" and aria-live="assertive"', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-error'));

    const toastEl = screen.getByTestId('toast');
    expect(toastEl).toHaveAttribute('role', 'alert');
    expect(toastEl).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Tente novamente');
  });

  it('dismisses a toast when the dismiss button is clicked', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('toast-dismiss'));
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('auto-dismisses after the default duration', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));
    expect(screen.getByTestId('toast')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByTestId('toast')).not.toBeInTheDocument();
  });

  it('never auto-dismisses when duration is 0', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-persistent'));
    vi.advanceTimersByTime(60000);

    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('stacks multiple toasts independently', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('trigger-success'));
    fireEvent.click(screen.getByText('trigger-error'));

    expect(screen.getAllByTestId('toast')).toHaveLength(2);
  });
});
