import React, { type HTMLAttributes, forwardRef } from 'react';

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  max?: number | undefined;
  label?: string | undefined;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className = '',
      value,
      max = 100,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        data-testid="progress"
        data-value={value}
        className={`ui-progress ${className}`.trim()}
        {...props}
      >
        <div
          data-testid="progress-bar"
          className="ui-progress__bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';
