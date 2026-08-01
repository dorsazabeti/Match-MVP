export const colors = {
  primary: '#0066FF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#11181C',
  textSecondary: '#687076',
  border: '#E6E8EB',
  error: '#E5484D',
  success: '#30A46C',
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
  h1: { fontSize: 24, fontWeight: 'bold' as const },
  h2: { fontSize: 20, fontWeight: 'bold' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  caption: { fontSize: 14, color: colors.textSecondary },
};

export const layout = {
  // PRD requirement: Minimum 44x44 touch targets
  minTouchTarget: 44, 
  borderRadius: 8,
};

export const theme = {
  colors,
  spacing,
  typography,
  layout,
};