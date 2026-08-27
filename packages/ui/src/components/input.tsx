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
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`ui-form-group ${className}`.trim()}>
        {label && (
          <label
            htmlFor={inputId}
            data-testid="input-label"
            className={`ui-form-label ${hasError ? 'ui-form-label--error' : ''}`}
          >
            {label}
          </label>
        )}

        <div className="ui-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span
              data-testid="input-left-icon"
              style={{
                position: 'absolute',
                left: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
                color: 'var(--text-secondary)',
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
            className={`ui-input-control ${hasError ? 'ui-input-control--error' : ''}`}
            style={{
              paddingLeft: leftIcon ? '2.5rem' : undefined,
              paddingRight: rightIcon ? '2.5rem' : undefined,
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
                color: 'var(--text-secondary)',
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
            className="ui-form-error"
          >
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            id={`${inputId}-helper`}
            data-testid="input-helper-text"
            className="ui-form-helper"
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
