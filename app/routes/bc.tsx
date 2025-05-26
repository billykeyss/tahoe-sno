import {
  Box,
  Container,
  Typography,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  alpha,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  GitHub as GitHubIcon,
  TrendingUp as TrendingUpIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { ResortGrid } from '../components/ResortGrid';

// Modern SaaS theme with enhanced design system (same as main app)
const createAppTheme = (isDark: boolean) =>
  createTheme({
    typography: {
      fontFamily:
        '"Inter", "SF Pro Display", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 800,
        fontSize: '3rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      },
      h2: {
        fontWeight: 700,
        fontSize: '2.25rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.875rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        letterSpacing: '-0.01em',
        lineHeight: 1.4,
      },
      subtitle1: {
        fontWeight: 500,
        fontSize: '1.125rem',
        lineHeight: 1.6,
        letterSpacing: '0.01em',
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
    },
    spacing: 8,
    shape: {
      borderRadius: 12,
    },
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: '#dc2626', // Canadian red
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
      },
      background: {
        default: isDark ? '#0a0a0a' : '#fafbfc',
        paper: isDark ? '#111111' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
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
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            fontFeatureSettings: '"cv03", "cv04", "cv11"',
            fontOpticalSizing: 'auto',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)'
              : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '8px',
            padding: '8px 16px',
          },
        },
      },
    },
  });

export default function BCPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => createAppTheme(isDarkMode), [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'background.default',
          backgroundImage: isDarkMode
            ? 'radial-gradient(ellipse at top, rgba(220, 38, 38, 0.05) 0%, transparent 70%), radial-gradient(ellipse at bottom, rgba(124, 58, 237, 0.05) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at top, rgba(220, 38, 38, 0.03) 0%, transparent 70%), radial-gradient(ellipse at bottom, rgba(124, 58, 237, 0.03) 0%, transparent 70%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Navigation Header */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(24px)',
            borderBottom: `1px solid ${theme.palette.divider}`,
            position: 'sticky',
            top: 0,
            zIndex: 1000,
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                py: { xs: 2, md: 3 },
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    component="span"
                    sx={{
                      fontSize: '2rem',
                      animation: 'float 6s ease-in-out infinite',
                      '@keyframes float': {
                        '0%, 100%': {
                          transform: 'translateY(0px) rotate(0deg)',
                        },
                        '50%': { transform: 'translateY(-4px) rotate(-2deg)' },
                      },
                    }}
                  >
                    🍁
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{
                      color: 'text.primary',
                      fontWeight: 800,
                      fontSize: { xs: '1.75rem', md: '2rem' },
                      background: isDarkMode
                        ? 'linear-gradient(135deg, #f87171 0%, #a78bfa 100%)'
                        : 'linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    TahoeSno BC
                  </Typography>
                </Box>

                {/* Status Badge */}
                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: '16px !important' }} />}
                  label="Live Data"
                  size="small"
                  sx={{
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.2
                    )}`,
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      color: 'inherit',
                    },
                  }}
                />
              </Box>

              {/* Navigation Actions */}
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="View on GitHub" arrow>
                  <IconButton
                    onClick={() =>
                      window.open(
                        'https://github.com/billykeyss/tahoe-sno',
                        '_blank'
                      )
                    }
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: alpha(
                          theme.palette.text.primary,
                          0.05
                        ),
                        color: 'text.primary',
                      },
                    }}
                  >
                    <GitHubIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={isDarkMode ? 'Light mode' : 'Dark mode'} arrow>
                  <IconButton
                    onClick={toggleDarkMode}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': {
                        backgroundColor: alpha(
                          theme.palette.text.primary,
                          0.05
                        ),
                        color: 'text.primary',
                      },
                    }}
                  >
                    {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Container>
        </Paper>

        {/* Hero Section */}
        <Box
          sx={{
            py: { xs: 4, md: 6 },
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
              : 'linear-gradient(135deg, rgba(220, 38, 38, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)',
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                textAlign: 'center',
                maxWidth: '800px',
                mx: 'auto',
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  color: 'text.primary',
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
                    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                British Columbia Snow Conditions
              </Typography>

              <Typography
                variant="subtitle1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  fontSize: { xs: '1.125rem', md: '1.25rem' },
                  lineHeight: 1.6,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Real-time snow reports, weather forecasts, and mountain
                conditions for British Columbia and Calgary area ski resorts.
                Updated hourly with the latest data.
              </Typography>

              {/* Updated Badge */}
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 3,
                  py: 1.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: '24px',
                  border: `1px solid ${alpha(
                    theme.palette.primary.main,
                    0.12
                  )}`,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'success.main',
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.6, transform: 'scale(1.1)' },
                    },
                  }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    color: 'primary.main',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Updated every hour • Powered by Open-Meteo
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main Content */}
        <Box component="main" sx={{ flex: 1, py: { xs: 4, md: 6 } }}>
          <Container maxWidth="xl">
            <ResortGrid
              country="canada"
              title="British Columbia Snow Report"
              subtitle="Comprehensive snow conditions and weather data for {count} ski resorts across British Columbia and the Canadian Rockies."
              featuredResorts={['louiselake', 'sunshine', 'norquay']}
            />
          </Container>
        </Box>

        {/* Footer */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(24px)',
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: 'auto',
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                py: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                © 2024 TahoeSno BC • Weather data provided by Open-Meteo API
              </Typography>
            </Box>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
