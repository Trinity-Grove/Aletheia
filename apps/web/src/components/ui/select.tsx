import React, { type SelectHTMLAttributes, forwardRef, useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  helperText?: string | undefined;
  error?: string | undefined;
  options?: SelectOption[] | undefined;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className = '',
      id,
      label,
      helperText,
      error,
      options,
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`ui-select-wrapper ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {label && (
          <label
            htmlFor={selectId}
            data-testid="select-label"
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
          <select
            ref={ref}
            id={selectId}
            data-testid="ui-select"
            data-error={hasError ? 'true' : 'false'}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            style={{
              width: '100%',
              appearance: 'none',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              lineHeight: 1.25,
              padding: '0.625rem 2.25rem 0.625rem 0.875rem',
              backgroundColor: disabled ? 'var(--sage-soft, #eef1e8)' : 'var(--paper, #fffdf7)',
              color: 'var(--ink, #17312a)',
              border: `1.5px solid ${
                hasError
                  ? 'var(--color-rose-600, #c53030)'
                  : 'var(--line, rgba(18, 63, 52, 0.14))'
              }`,
              borderRadius: 'var(--radius-md, 6px)',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              ...style,
            }}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span
            data-testid="select-chevron"
            style={{
              position: 'absolute',
              right: '0.875rem',
              pointerEvents: 'none',
              color: 'var(--muted, #5c6f67)',
              fontSize: '0.75rem',
            }}
          >
            ▼
          </span>
        </div>

        {error && (
          <span
            id={`${selectId}-error`}
            data-testid="select-error-text"
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
            id={`${selectId}-helper`}
            data-testid="select-helper-text"
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

Select.displayName = 'Select';
