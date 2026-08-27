import React, { type ButtonHTMLAttributes, forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        data-testid="button"
        data-variant={variant}
        data-size={size}
        disabled={disabled || isLoading}
        className={`ui-button ui-button--${variant} ui-button--${size} ${
          isLoading ? 'ui-button--loading' : ''
        } ${className}`.trim()}
        {...props}
      >
        {isLoading && (
          <span
            data-testid="button-spinner"
            className="ui-button__spinner"
            aria-hidden="true"
          />
        )}
        {!isLoading && leftIcon && (
          <span className="ui-button__icon ui-button__icon--left">{leftIcon}</span>
        )}
        <span className="ui-button__text">{children}</span>
        {!isLoading && rightIcon && (
          <span className="ui-button__icon ui-button__icon--right">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
