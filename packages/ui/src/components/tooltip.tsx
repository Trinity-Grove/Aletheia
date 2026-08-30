'use client';

import React, { useEffect, useId, useRef, useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delayMs = 200,
}: TooltipProps) {
  const [isHoverVisible, setIsHoverVisible] = useState(false);
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();
  const isVisible = isHoverVisible || isFocusVisible;

  const clearShowTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showTooltip = () => {
    clearShowTimer();
    timerRef.current = setTimeout(() => {
      setIsHoverVisible(true);
    }, delayMs);
  };

  const showTooltipImmediately = () => {
    setIsFocusVisible(true);
  };

  const hideHoveredTooltip = () => {
    clearShowTimer();
    setIsHoverVisible(false);
  };

  const hideFocusedTooltip = () => setIsFocusVisible(false);

  useEffect(() => clearShowTimer, []);

  const triggerChild = children as React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  const existingDescription = triggerChild.props['aria-describedby'];
  const trigger = React.cloneElement(triggerChild, {
    'aria-describedby': isVisible
      ? [existingDescription, tooltipId].filter(Boolean).join(' ')
      : existingDescription,
  });

  return (
    <div
      className="ui-tooltip-wrapper"
      onMouseEnter={showTooltip}
      onMouseLeave={hideHoveredTooltip}
      onFocus={showTooltipImmediately}
      onBlur={hideFocusedTooltip}
      data-testid="tooltip-wrapper"
    >
      {trigger}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`ui-tooltip ui-tooltip--${position}`}
          data-testid="tooltip-content"
        >
          {content}
        </div>
      )}
    </div>
  );
}
