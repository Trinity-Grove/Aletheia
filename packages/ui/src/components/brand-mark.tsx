import React from 'react';

export interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * The Aletheia monogram: a forest-green roundel with a gold "A" — the shell's
 * visual anchor to the site's Trinity Grove identity (issue #24). A simple
 * geometric mark, not a photographic logo, so it renders crisply at any size
 * without a raster asset.
 */
export function BrandMark({ size = 32, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Aletheia"
      className={`ui-brand-mark ${className}`.trim()}
    >
      <circle cx="16" cy="16" r="16" fill="var(--forest)" />
      {/* Two legs and a crossbar — a monogram "A" built from plain shapes
          rather than a single hollow path, so there's no winding-order
          ambiguity to get wrong. */}
      <polygon points="16,8 23,24 19.3,24" fill="var(--gold)" />
      <polygon points="16,8 12.7,24 9,24" fill="var(--gold)" />
      <rect x="13.5" y="17.5" width="5" height="2.4" fill="var(--gold)" />
    </svg>
  );
}
