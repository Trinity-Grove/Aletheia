import React, { type HTMLAttributes, forwardRef } from 'react';

export interface ScriptureCardProps extends HTMLAttributes<HTMLDivElement> {
  verseText: string;
  citation: string;
}

export const ScriptureCard = forwardRef<HTMLDivElement, ScriptureCardProps>(
  ({ className = '', verseText, citation, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-testid="scripture-card"
        className={`ui-scripture-card ${className}`.trim()}
        {...props}
      >
        <div style={{ position: 'relative', zIndex: 2, paddingLeft: '1.75rem' }}>
          <p data-testid="scripture-card-verse" className="ui-scripture-card__verse">
            &ldquo;{verseText}&rdquo;
          </p>
          <span data-testid="scripture-card-citation" className="ui-scripture-card__citation">
            — {citation}
          </span>
        </div>
      </div>
    );
  }
);

ScriptureCard.displayName = 'ScriptureCard';
