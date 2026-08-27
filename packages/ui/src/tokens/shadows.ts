export const shadows = {
  sm: '0 2px 4px 0 rgba(18, 63, 52, 0.04)',
  md: '0 6px 16px -2px rgba(18, 63, 52, 0.07), 0 2px 6px -1px rgba(18, 63, 52, 0.04)',
  lg: '0 16px 32px -4px rgba(18, 63, 52, 0.09), 0 6px 12px -2px rgba(18, 63, 52, 0.04)',
  xl: '0 24px 70px rgba(11, 47, 39, 0.13)',
  inner: 'inset 0 2px 4px 0 rgba(18, 63, 52, 0.05)',
  none: 'none',
} as const;

export type ShadowKey = keyof typeof shadows;
