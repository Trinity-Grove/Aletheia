'use client';

import React, { useEffect, useRef, type ReactNode } from 'react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnEscape?: boolean;
  closeOnBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  closeOnEscape = true,
  closeOnBackdropClick = true,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
      data-testid="modal-backdrop"
      className="ui-modal__backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={contentRef}
        data-testid="modal-container"
        className={`ui-modal__container ui-modal__container--${maxWidth}`}
      >
        {(title || description) && (
          <div className="ui-modal__header">
            <div>
              {title && (
                <h3 data-testid="modal-title" className="ui-modal__title">
                  {title}
                </h3>
              )}
              {description && (
                <p data-testid="modal-description" className="ui-modal__description">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              data-testid="modal-close-btn"
              aria-label="Fechar"
              className="ui-modal__close-btn"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        )}

        <div data-testid="modal-body" className="ui-modal__body">
          {children}
        </div>

        {footer && (
          <div data-testid="modal-footer" className="ui-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
