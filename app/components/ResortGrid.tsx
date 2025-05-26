import { Box, Typography, Fade, alpha, useTheme } from '@mui/material';
import {
  LocationOn as LocationIcon,
  ConfirmationNumber as PassIcon,
} from '@mui/icons-material';
import { ResortCard } from './ResortCard';
import resortsConfig from '../config/resorts.json';

export interface Resort {
  id: string;
  name: string;
  weatherUnlockedId: number;
  elevation: {
    base: number;
    summit: number;
  };
  coordinates: {
    lat: number;
    lon: number;
  };
  region: string;
  status: string;
  country?: string;
}

interface ResortGridProps {
  country?: string;
  title?: string;
  subtitle?: string;
  featuredResorts?: string[];
}

// Tahoe Local Pass resort IDs
const TAHOE_LOCAL_PASS_RESORTS = ['heavenly', 'northstar', 'kirkwood'];

// Big 3 Calgary/Banff resort IDs
const BIG_3_RESORTS = ['louiselake', 'sunshine', 'norquay'];

export function ResortGrid({
  country = 'usa',
  title = 'California Snow Report',
  subtitle = 'Comprehensive snow conditions and weather data for ski resorts across the Sierra Nevada mountains.',
  featuredResorts = TAHOE_LOCAL_PASS_RESORTS,
}: ResortGridProps) {
  const theme = useTheme();
  const { resorts } = resortsConfig;

  // Filter resorts by country and active status
  const countryResorts = resorts.filter((resort) => {
    const resortCountry = resort.country || 'usa';
    return resort.status === 'active' && resortCountry === country;
  });

  // Separate featured resorts from others
  const featuredResortsData = countryResorts.filter((resort) =>
    featuredResorts.includes(resort.id)
  );

  const otherResorts = countryResorts
    .filter((resort) => !featuredResorts.includes(resort.id))
    .sort((a, b) => {
      // Sort by region first, then by name
      if (a.region !== b.region) {
        return a.region.localeCompare(b.region);
      }
      return a.name.localeCompare(b.name);
    });

  // Group other resorts by region
  const groupedOtherResorts = Object.entries(
    otherResorts.reduce((acc, resort) => {
      if (!acc[resort.region]) {
        acc[resort.region] = [];
      }
      acc[resort.region].push(resort);
      return acc;
    }, {} as Record<string, typeof otherResorts>)
  );

  // Sort featured resorts in a specific order for better display
  const sortedFeaturedResorts = featuredResortsData.sort((a, b) => {
    const order = featuredResorts;
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  // Get featured section title and description
  const getFeaturedSectionInfo = () => {
    if (country === 'canada') {
      return {
        title: 'Big 3 Lift Ticket',
        subtitle: 'Banff & Lake Louise ski areas',
      };
    }
    return {
      title: 'Tahoe Local Pass',
      subtitle: 'Your season pass resorts',
    };
  };

  const featuredInfo = getFeaturedSectionInfo();

  return (
    <Box
      sx={{
        maxWidth: '1600px',
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          mb: { xs: 4, md: 6 },
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' },
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: 'text.secondary',
            fontSize: '1.125rem',
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          {subtitle.replace('{count}', countryResorts.length.toString())}
        </Typography>
      </Box>

      {/* Featured Resorts Section */}
      {featuredResortsData.length > 0 && (
        <Fade in={true} timeout={300}>
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            {/* Featured Header */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.primary.main,
                  0.08
                )} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.warning.main} 100%)`,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <PassIcon
                    sx={{
                      fontSize: 28,
                      color: 'primary.main',
                    }}
                  />
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        fontSize: { xs: '1.5rem', md: '1.875rem' },
                        lineHeight: 1.2,
                      }}
                    >
                      {featuredInfo.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      {featuredInfo.subtitle}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    px: 2.5,
                    py: 1,
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    borderRadius: '20px',
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.25
                    )}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
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
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {featuredResortsData.length} Resort
                    {featuredResortsData.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Featured Resort Cards Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(auto-fit, minmax(320px, 1fr))',
                  md: 'repeat(auto-fit, minmax(350px, 1fr))',
                  lg: 'repeat(auto-fit, minmax(380px, 1fr))',
                },
                gap: { xs: 2.5, md: 3 },
                width: '100%',
              }}
            >
              {sortedFeaturedResorts.map((resort, index) => (
                <Fade in={true} timeout={500 + index * 50} key={resort.id}>
                  <Box>
                    <ResortCard resort={resort as Resort} />
                  </Box>
                </Fade>
              ))}
            </Box>
          </Box>
        </Fade>
      )}

      {/* Other Resort Regions */}
      {groupedOtherResorts.map(([region, regionResorts], regionIndex) => (
        <Fade in={true} timeout={300 + (regionIndex + 1) * 100} key={region}>
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            {/* Region Header */}
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.text.primary, 0.03),
                border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${alpha(
                    theme.palette.text.primary,
                    0.2
                  )} 0%, ${alpha(theme.palette.text.primary, 0.1)} 100%)`,
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationIcon
                    sx={{
                      fontSize: 24,
                      color: 'text.secondary',
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 600,
                      color: 'text.primary',
                      fontSize: { xs: '1.5rem', md: '1.875rem' },
                    }}
                  >
                    {region}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    backgroundColor: alpha(theme.palette.text.primary, 0.08),
                    borderRadius: '16px',
                    border: `1px solid ${alpha(
                      theme.palette.text.primary,
                      0.12
                    )}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {regionResorts.length} Resort
                    {regionResorts.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Resort Cards Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(auto-fit, minmax(320px, 1fr))',
                  md: 'repeat(auto-fit, minmax(350px, 1fr))',
                  lg: 'repeat(auto-fit, minmax(380px, 1fr))',
                },
                gap: { xs: 2.5, md: 3 },
                width: '100%',
              }}
            >
              {regionResorts.map((resort, index) => (
                <Fade in={true} timeout={500 + index * 50} key={resort.id}>
                  <Box>
                    <ResortCard resort={resort as Resort} />
                  </Box>
                </Fade>
              ))}
            </Box>
          </Box>
        </Fade>
      ))}
    </Box>
  );
}
