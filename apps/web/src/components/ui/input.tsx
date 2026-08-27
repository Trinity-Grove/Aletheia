import React, { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  helperText?: string | undefined;
  error?: string | undefined;
  leftIcon?: React.ReactNode | undefined;
  rightIcon?: React.ReactNode | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      id,
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`ui-input-wrapper ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {label && (
          <label
            htmlFor={inputId}
            data-testid="input-label"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: hasError ? 'var(--color-rose-700, #9f2424)' : 'var(--text-primary, #17312a)',
            }}
          >
            {label}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              data-testid="input-left-icon"
              style={{
                position: 'absolute',
                left: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: 'var(--muted, #5c6f67)',
                fontSize: '1rem',
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            data-testid="ui-input"
            data-error={hasError ? 'true' : 'false'}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            style={{
              width: '100%',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              lineHeight: 1.25,
              padding: '0.625rem 0.875rem',
              paddingLeft: leftIcon ? '2.5rem' : '0.875rem',
              paddingRight: rightIcon ? '2.5rem' : '0.875rem',
              backgroundColor: disabled ? 'var(--sage-soft, #eef1e8)' : 'var(--paper, #fffdf7)',
              color: 'var(--ink, #17312a)',
              border: `1.5px solid ${
                hasError
                  ? 'var(--color-rose-600, #c53030)'
                  : 'var(--line, rgba(18, 63, 52, 0.14))'
              }`,
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              ...style,
            }}
            {...props}
          />

          {rightIcon && (
            <span
              data-testid="input-right-icon"
              style={{
                position: 'absolute',
                right: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: 'var(--muted, #5c6f67)',
                fontSize: '1rem',
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <span
            id={`${inputId}-error`}
            data-testid="input-error-text"
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
            id={`${inputId}-helper`}
            data-testid="input-helper-text"
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

Input.displayName = 'Input';
