import { NavLink } from 'react-router';
import { Box, Chip, Stack, alpha, useTheme } from '@mui/material';
import {
  Home as HomeIcon,
  Public as PublicIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export function AppNav() {
  const theme = useTheme();

  return (
    <Box
      component="nav"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {/* California Resorts */}
        <Chip
          component={NavLink}
          to="/"
          icon={
            <Box component="span" sx={{ fontSize: '16px !important' }}>
              ❄️
            </Box>
          }
          label="California"
          clickable
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 2,
            py: 1,
            textDecoration: 'none',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
              transform: 'translateY(-1px)',
            },
            '&.active': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              borderColor: theme.palette.primary.main,
            },
            transition: 'all 0.2s ease',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />

        {/* British Columbia Resorts */}
        <Chip
          component={NavLink}
          to="/bc"
          icon={
            <Box component="span" sx={{ fontSize: '16px !important' }}>
              🍁
            </Box>
          }
          label="British Columbia/Alberta"
          clickable
          sx={{
            backgroundColor: alpha('#dc2626', 0.1),
            color: '#dc2626',
            border: `1px solid ${alpha('#dc2626', 0.2)}`,
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 2,
            py: 1,
            textDecoration: 'none',
            '&:hover': {
              backgroundColor: alpha('#dc2626', 0.15),
              transform: 'translateY(-1px)',
            },
            '&.active': {
              backgroundColor: alpha('#dc2626', 0.2),
              borderColor: '#dc2626',
            },
            transition: 'all 0.2s ease',
            '& .MuiChip-icon': {
              color: 'inherit',
            },
          }}
        />
      </Stack>
    </Box>
  );
}
