import React, { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | undefined;
  description?: string | undefined;
  error?: string | undefined;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className = '',
      id,
      label,
      description,
      error,
      checked,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className={`ui-checkbox-container ${className}`.trim()} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label
          htmlFor={checkboxId}
          data-testid="checkbox-wrapper"
          className="ui-checkbox-wrapper"
          style={{
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            data-testid="ui-checkbox-input"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="ui-checkbox-control"
            {...props}
          />

          {(label || description) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              {label && (
                <span data-testid="checkbox-label" className="ui-form-label" style={{ cursor: 'inherit' }}>
                  {label}
                </span>
              )}
              {description && (
                <span data-testid="checkbox-description" className="ui-form-helper">
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {error && (
          <span data-testid="checkbox-error-text" role="alert" className="ui-form-error">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
