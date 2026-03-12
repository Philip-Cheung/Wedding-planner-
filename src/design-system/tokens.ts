/**
 * Design system tokens for Wedding Planner
 * Premium, editorial, calm, consumer-friendly
 */

export const tokens = {
  colors: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    primary: 'var(--primary)',
    primaryForeground: 'var(--primary-foreground)',
    muted: 'var(--muted)',
    mutedForeground: 'var(--muted-foreground)',
    border: 'var(--border)',
    ring: 'var(--ring)',
  },
  typography: {
    fontSans: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
    fontSerif: 'var(--font-serif, ui-serif, Georgia, serif)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: 'calc(var(--radius) - 4px)',
    md: 'calc(var(--radius) - 2px)',
    lg: 'var(--radius)',
  },
} as const
