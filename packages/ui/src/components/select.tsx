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
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`ui-form-group ${className}`.trim()}>
        {label && (
          <label
            htmlFor={selectId}
            data-testid="select-label"
            className={`ui-form-label ${hasError ? 'ui-form-label--error' : ''}`}
          >
            {label}
          </label>
        )}

        <div className="ui-select-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            ref={ref}
            id={selectId}
            data-testid="ui-select"
            data-error={hasError ? 'true' : 'false'}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={`ui-input-control ${hasError ? 'ui-input-control--error' : ''}`}
            style={{ appearance: 'none', paddingRight: '2.25rem', cursor: disabled ? 'not-allowed' : 'pointer' }}
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
              color: 'var(--text-secondary)',
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
            className="ui-form-error"
          >
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            id={`${selectId}-helper`}
            data-testid="select-helper-text"
            className="ui-form-helper"
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
