import { createTheme, alpha, ThemeOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
      accent: string;
    };
  }

  interface PaletteOptions {
    gradient?: {
      primary?: string;
      secondary?: string;
      accent?: string;
    };
  }
}

const createAppTheme = (isDark: boolean) => {
  const baseTheme = createTheme({
    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        'SF Pro Display',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'sans-serif',
      ].join(','),
    },
  });

  const themeOptions: ThemeOptions = {
    typography: {
      fontFamily: baseTheme.typography.fontFamily,
      h1: {
        fontWeight: 800,
        fontSize: '3.5rem',
        letterSpacing: '-0.025em',
        lineHeight: 1.1,
        fontFeatureSettings: '"ss01", "ss02"',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2.75rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
        fontFeatureSettings: '"ss01", "ss02"',
      },
      h3: {
        fontWeight: 600,
        fontSize: '2.25rem',
        letterSpacing: '-0.015em',
        lineHeight: 1.2,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.875rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.005em',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1.25rem',
        letterSpacing: '0em',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1.125rem',
        lineHeight: 1.6,
        letterSpacing: '0.005em',
      },
      subtitle2: {
        fontWeight: 500,
        fontSize: '1rem',
        lineHeight: 1.5,
        letterSpacing: '0.005em',
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
        letterSpacing: '0.01em',
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
        letterSpacing: '0.01em',
      },
      caption: {
        fontSize: '0.75rem',
        lineHeight: 1.4,
        letterSpacing: '0.02em',
        fontWeight: 500,
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.01em',
        textTransform: 'none',
      },
    },
    spacing: 8,
    shape: {
      borderRadius: 12,
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
      },
    },
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#2563eb',
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#7c3aed',
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
        contrastText: '#ffffff',
      },
      success: {
        main: '#059669',
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
        contrastText: '#ffffff',
      },
      warning: {
        main: '#d97706',
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
        contrastText: '#ffffff',
      },
      error: {
        main: '#dc2626',
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        contrastText: '#ffffff',
      },
      info: {
        main: '#0891b2',
        50: '#ecfeff',
        100: '#cffafe',
        200: '#a5f3fc',
        300: '#67e8f9',
        400: '#22d3ee',
        500: '#06b6d4',
        600: '#0891b2',
        700: '#0e7490',
        800: '#155e75',
        900: '#164e63',
        contrastText: '#ffffff',
      },
      background: {
        default: isDark ? '#0a0a0a' : '#fafbfc',
        paper: isDark ? '#111111' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
        disabled: isDark ? '#475569' : '#cbd5e1',
      },
      grey: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      divider: isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08),
      gradient: {
        primary: `linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)`,
        secondary: `linear-gradient(135deg, #059669 0%, #0891b2 100%)`,
        accent: `linear-gradient(135deg, #f59e0b 0%, #d97706 100%)`,
      },
    },
    shadows: isDark
      ? [
          'none',
          '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
          '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
          '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
          '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        ]
      : [
          'none',
          '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '@global': {
            '@import': [
              'url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap")',
            ],
          },
          body: {
            fontFeatureSettings: '"cv03", "cv04", "cv11"',
            fontOpticalSizing: 'auto',
            scrollBehavior: 'smooth',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
          '*': {
            boxSizing: 'border-box',
          },
          '*::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '*::-webkit-scrollbar-track': {
            backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
          },
          '*::-webkit-scrollbar-thumb': {
            backgroundColor: isDark ? '#475569' : '#cbd5e1',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: isDark ? '#64748b' : '#94a3b8',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '10px',
            padding: '10px 20px',
            fontSize: '0.9375rem',
            boxShadow: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
          contained: {
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border: `1px solid ${
              isDark ? alpha('#ffffff', 0.08) : alpha('#000000', 0.08)
            }`,
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.8125rem',
            height: 'auto',
            padding: '4px 8px',
            '& .MuiChip-label': {
              padding: '0 4px',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#334155' : '#1e293b',
            color: '#f8fafc',
            fontSize: '0.8125rem',
            fontWeight: 500,
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          arrow: {
            color: isDark ? '#334155' : '#1e293b',
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? alpha('#ffffff', 0.08)
              : alpha('#000000', 0.08),
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

export default createAppTheme;
