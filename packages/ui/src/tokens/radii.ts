export const radii = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '14px',
  '2xl': '20px',
  full: '9999px',
} as const;

export type RadiusKey = keyof typeof radii;
