export const colors = {
  primary: '#6657F5',
  primarySoft: '#EFEDFF',
  accent: '#A95BEA',
  background: '#F7F6FC',
  surface: '#FFFFFF',
  text: '#29263A',
  textSecondary: '#777286',
  border: '#DDD9EA',
  error: '#D94B64',
  success: '#18865F',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: 'bold' as const },
  h2: { fontSize: 20, fontWeight: 'bold' as const },
  body: { fontSize: 16, lineHeight: 26, fontWeight: 'normal' as const },
  caption: { fontSize: 14, color: colors.textSecondary },
};

export const layout = {
  // PRD requirement: Minimum 44x44 touch targets
  minTouchTarget: 48,
  borderRadius: 12,
  cardRadius: 20,
};

export const theme = {
  colors,
  spacing,
  typography,
  layout,
};
