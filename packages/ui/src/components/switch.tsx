import React, { type InputHTMLAttributes, forwardRef, useId } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string | undefined;
  description?: string | undefined;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className = '',
      id,
      label,
      description,
      checked,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const switchId = id || generatedId;

    return (
      <label
        htmlFor={switchId}
        data-testid="switch-wrapper"
        className={`ui-switch ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: description ? 'flex-start' : 'center',
          gap: '0.75rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          userSelect: 'none',
        }}
      >
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginTop: description ? '0.125rem' : 0 }}>
          <input
            ref={ref}
            id={switchId}
            type="checkbox"
            role="switch"
            data-testid="ui-switch-input"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            aria-checked={checked}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              borderWidth: 0,
            }}
            {...props}
          />
          <div
            data-testid="ui-switch-track"
            data-checked={checked ? 'true' : 'false'}
            style={{
              width: '2.5rem',
              height: '1.375rem',
              backgroundColor: checked ? 'var(--color-brand-forest)' : 'var(--color-brand-sage-soft)',
              border: `1.5px solid ${checked ? 'var(--color-brand-forest)' : 'var(--border-medium)'}`,
              borderRadius: '9999px',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              data-testid="ui-switch-thumb"
              data-checked={checked ? 'true' : 'false'}
              style={{
                position: 'absolute',
                top: '1px',
                left: checked ? 'calc(100% - 1.125rem - 1px)' : '1px',
                width: '1.125rem',
                height: '1.125rem',
                backgroundColor: checked ? 'var(--color-brand-gold)' : '#ffffff',
                borderRadius: '50%',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>

        {(label || description) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
            {label && (
              <span data-testid="switch-label" className="ui-form-label" style={{ cursor: 'inherit' }}>
                {label}
              </span>
            )}
            {description && (
              <span data-testid="switch-description" className="ui-form-helper">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
