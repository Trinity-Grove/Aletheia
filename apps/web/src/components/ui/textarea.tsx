import React, { type TextareaHTMLAttributes, forwardRef, useId } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | undefined;
  helperText?: string | undefined;
  error?: string | undefined;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className = '',
      id,
      label,
      helperText,
      error,
      rows = 3,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`ui-textarea-wrapper ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {label && (
          <label
            htmlFor={textareaId}
            data-testid="textarea-label"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: hasError ? 'var(--color-rose-700, #9f2424)' : 'var(--text-primary, #17312a)',
            }}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          data-testid="ui-textarea"
          data-error={hasError ? 'true' : 'false'}
          rows={rows}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          style={{
            width: '100%',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            padding: '0.625rem 0.875rem',
            backgroundColor: disabled ? 'var(--sage-soft, #eef1e8)' : 'var(--paper, #fffdf7)',
            color: 'var(--ink, #17312a)',
            border: `1.5px solid ${
              hasError
                ? 'var(--color-rose-600, #c53030)'
                : 'var(--line, rgba(18, 63, 52, 0.14))'
            }`,
            borderRadius: 'var(--radius-md, 6px)',
            outline: 'none',
            resize: 'vertical',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...style,
          }}
          {...props}
        />

        {error && (
          <span
            id={`${textareaId}-error`}
            data-testid="textarea-error-text"
            role="alert"
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-rose-700, #9f2424)',
              fontWeight: 500,
            }}
          >
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            id={`${textareaId}-helper`}
            data-testid="textarea-helper-text"
            style={{
              fontSize: '0.75rem',
              color: 'var(--muted, #5c6f67)',
            }}
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
