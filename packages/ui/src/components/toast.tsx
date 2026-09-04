'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  variant?: ToastVariant;
  title?: string;
  description?: string;
  /** Milliseconds before auto-dismiss. 0 disables auto-dismiss. Default 5000. */
  duration?: number;
}

interface ToastRecord extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 5000;

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  info: <Info size={18} />,
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  error: <XCircle size={18} />,
};

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `toast-${idCounter}`;
}

function ToastItem({ record, onDismiss }: { record: ToastRecord; onDismiss: (id: string) => void }) {
  const variant = record.variant ?? 'info';
  const duration = record.duration ?? DEFAULT_DURATION_MS;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(record.id), duration);
    return () => clearTimeout(timer);
  }, [record.id, duration, onDismiss]);

  return (
    <div
      data-testid="toast"
      data-variant={variant}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={`ui-toast ui-toast--${variant}`}
    >
      <span data-testid="toast-icon" className="ui-toast__icon" aria-hidden="true">
        {VARIANT_ICONS[variant]}
      </span>
      <div className="ui-toast__content">
        {record.title && (
          <p data-testid="toast-title" className="ui-toast__title">
            {record.title}
          </p>
        )}
        {record.description && (
          <p data-testid="toast-description" className="ui-toast__description">
            {record.description}
          </p>
        )}
      </div>
      <button
        type="button"
        data-testid="toast-dismiss"
        aria-label="Dispensar notificação"
        className="ui-toast__dismiss"
        onClick={() => onDismiss(record.id)}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: ToastOptions) => {
    const id = nextId();
    setToasts((current) => [...current, { ...options, id }]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div data-testid="toast-viewport" className="ui-toast-viewport">
        {toasts.map((record) => (
          <ToastItem key={record.id} record={record} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
}
