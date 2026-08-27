export const brandColors = {
  forest: '#123f34',
  forest2: '#0c3028',
  forestDark: '#08251f',
  sage: '#78937f',
  sageLight: '#dce6dc',
  sageSoft: '#eef1e8',
  gold: '#d3a526',
  goldSoft: '#f3e5b6',
  goldMuted: '#d7bf79',
  ivory: '#fbf8ef',
  paper: '#fffdf7',
  ink: '#17312a',
  muted: '#5c6f67',
  line: 'rgba(18, 63, 52, 0.14)',
  lineStrong: 'rgba(18, 63, 52, 0.24)',
} as const;

export const semanticColors = {
  emerald: {
    50: '#f1f6f1',
    100: '#dce6dc',
    600: '#1b5346',
    700: '#123f34',
  },
  amber: {
    50: '#fefbf2',
    100: '#f9f0d0',
    600: '#d3a526',
    700: '#b48517',
  },
  rose: {
    50: '#fdf2f2',
    100: '#fde8e8',
    600: '#c53030',
    700: '#9f2424',
  },
  indigo: {
    50: '#f0f7fb',
    100: '#dbeef7',
    600: '#245c7d',
    700: '#1a445d',
  },
  slate: {
    50: '#fbf8ef',
    100: '#eef1e8',
    200: '#e2e8e3',
    300: '#cad6ce',
    400: '#a3b8aa',
    500: '#78937f',
    600: '#5c6f67',
    700: '#36564c',
    800: '#23443b',
    900: '#17312a',
  },
} as const;

export const surfaceColors = {
  canvas: brandColors.ivory,
  surface: brandColors.paper,
  surfaceHover: '#f5f2e6',
  parchment: brandColors.ivory,
} as const;

export type BrandColorKey = keyof typeof brandColors;
export type SurfaceColorKey = keyof typeof surfaceColors;
