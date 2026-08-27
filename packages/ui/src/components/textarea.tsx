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
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className={`ui-form-group ${className}`.trim()}>
        {label && (
          <label
            htmlFor={textareaId}
            data-testid="textarea-label"
            className={`ui-form-label ${hasError ? 'ui-form-label--error' : ''}`}
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
          className={`ui-input-control ${hasError ? 'ui-input-control--error' : ''}`}
          style={{ resize: 'vertical', minHeight: '5rem', lineHeight: 1.5 }}
          {...props}
        />

        {error && (
          <span
            id={`${textareaId}-error`}
            data-testid="textarea-error-text"
            role="alert"
            className="ui-form-error"
          >
            {error}
          </span>
        )}

        {!error && helperText && (
          <span
            id={`${textareaId}-helper`}
            data-testid="textarea-helper-text"
            className="ui-form-helper"
          >
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
