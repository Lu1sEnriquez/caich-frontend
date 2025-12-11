export const THEME_COLORS = {
  background: '#f6fbff',
  foreground: '#0f1724',
  border: '#e6eef6',
  input: '#ffffff',
  primary: '#3b82f6',
  primaryForeground: '#ffffff',
  secondary: '#e6f6f0',
  secondaryForeground: '#064e3b',
  muted: '#f3f6f9',
  mutedForeground: '#6b7280',
  success: '#10b981',
  successForeground: '#ffffff',
  accent: '#60a5fa',
  accentForeground: '#07294d',
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  warning: '#f59e0b',
  warningForeground: '#09202a',
  card: '#ffffff',
  cardForeground: '#09202a',
  sidebar: '#eaf2ff',
  sidebarPrimary: '#3b82f6',
  sidebarPrimaryForeground: '#ffffff',
} as const;

export const THEME_ROUNDNESS = {
  small: '6px',
  medium: '12px',
  large: '24px',
  veryLarge: '48px',
} as const;

export const THEME_FONTS = {
  primary: 'Inter, system-ui, -apple-system, sans-serif',
} as const;

export const THEME_SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const THEME_SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
} as const;
