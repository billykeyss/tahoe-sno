import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Skeleton,
  Alert,
  Divider,
  Stack,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme,
  IconButton,
} from '@mui/material';
import {
  AcUnit as SnowIcon,
  Thermostat as TempIcon,
  Height as ElevationIcon,
  Air as WindIcon,
  Timeline as ChartIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  DeviceThermostat as FeelsLikeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Resort } from './ResortGrid';
import { apiClient, type WeatherData } from '../services/apiClient';

interface ResortCardProps {
  resort: Resort;
}

const WEATHER_ICONS = {
  sunny: '☀️',
  'partly-cloudy': '⛅',
  cloudy: '☁️',
  snow: '❄️',
  rain: '🌧️',
} as const;

const CONDITION_COLORS = {
  sunny: '#f59e0b',
  'partly-cloudy': '#8b5cf6',
  cloudy: '#6b7280',
  snow: '#3b82f6',
  rain: '#06b6d4',
} as const;

const SNOW_QUALITY_THRESHOLDS = {
  excellent: 20,
  good: 10,
  fair: 5,
  poor: 0,
} as const;

const getSnowQuality = (freshSnow: number) => {
  if (freshSnow >= SNOW_QUALITY_THRESHOLDS.excellent)
    return { label: 'Excellent', color: '#059669' };
  if (freshSnow >= SNOW_QUALITY_THRESHOLDS.good)
    return { label: 'Good', color: '#0891b2' };
  if (freshSnow >= SNOW_QUALITY_THRESHOLDS.fair)
    return { label: 'Fair', color: '#ea580c' };
  return { label: 'Poor', color: '#dc2626' };
};

export function ResortCard({ resort }: ResortCardProps) {
  const theme = useTheme();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWeatherData = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      // Use Open-Meteo as primary weather API (free, reliable, no CORS issues)
      const data = await apiClient.getResortWeatherPrimary(
        resort.coordinates.lat,
        resort.coordinates.lon
      );

      setWeatherData(data);
    } catch (err) {
      console.error(`Error fetching weather data for ${resort.name}:`, err);
      setError(
        err instanceof Error ? err.message : 'Failed to load weather data'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();

    // Set up automatic refresh every 60 minutes
    const refreshInterval = setInterval(
      () => fetchWeatherData(),
      60 * 60 * 1000
    );
    return () => clearInterval(refreshInterval);
  }, [resort.coordinates, resort.name]);

  const formatDepth = (cm: number) =>
    `${Math.round(cm)}cm (${Math.round(cm * 0.393701)}")`;
  const formatTemp = (c: number) =>
    `${c}°C (${Math.round((c * 9) / 5 + 32)}°F)`;

  const formatElevation = (elevation: { base: number; summit: number }) => {
    const isCanadian = resort.country === 'canada';
    if (isCanadian) {
      // Convert feet to meters for Canadian resorts
      const baseM = Math.round(elevation.base * 0.3048);
      const summitM = Math.round(elevation.summit * 0.3048);
      return `${baseM}m - ${summitM}m`;
    }
    return `${elevation.base}ft - ${elevation.summit}ft`;
  };

  if (loading) {
    return (
      <Card
        sx={{
          height: '100%',
          backgroundColor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[1],
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Skeleton variant="text" width="80%" height={32} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="rounded" width="100%" height={140} />
            <Stack direction="row" spacing={2}>
              <Skeleton variant="rounded" width="48%" height={80} />
              <Skeleton variant="rounded" width="48%" height={80} />
            </Stack>
            <Skeleton variant="rounded" width="100%" height={100} />
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error || !weatherData) {
    return (
      <Card
        sx={{
          height: '100%',
          backgroundColor: 'background.paper',
          border: `1px solid ${theme.palette.error.main}`,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            {resort.name}
          </Typography>
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => fetchWeatherData()}
                disabled={loading}
              >
                <RefreshIcon />
              </IconButton>
            }
          >
            <Typography variant="body2">Unable to load weather data</Typography>
            {error && (
              <Typography
                variant="caption"
                display="block"
                sx={{ mt: 0.5, opacity: 0.8 }}
              >
                {error}
              </Typography>
            )}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const totalWeekSnow = weatherData.historical_snow.reduce(
    (sum, day) => sum + day.snow_cm,
    0
  );

  const maxHistoricalSnow = Math.max(
    ...weatherData.historical_snow.map((d) => d.snow_cm),
    1
  );

  const snowQuality = getSnowQuality(weatherData.freshsnow_cm);
  const currentCondition = weatherData.forecast[0]?.condition || 'cloudy';

  return (
    <Card
      sx={{
        height: '100%',
        backgroundColor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              : '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          borderColor: alpha(theme.palette.primary.main, 0.3),
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${
            CONDITION_COLORS[currentCondition] || '#6b7280'
          } 0%, ${alpha(
            CONDITION_COLORS[currentCondition] || '#6b7280',
            0.5
          )} 100%)`,
        },
      }}
    >
      <CardContent
        sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header Section */}
        <Box sx={{ p: 3, pb: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            spacing={2}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.375rem',
                  lineHeight: 1.2,
                  color: 'text.primary',
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {resort.name}
              </Typography>
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                flexWrap="wrap"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ElevationIcon
                    sx={{ fontSize: 16, color: 'text.secondary' }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={500}
                  >
                    {formatElevation(resort.elevation)}
                  </Typography>
                </Box>
                <Chip
                  label={snowQuality.label}
                  size="small"
                  sx={{
                    backgroundColor: alpha(snowQuality.color, 0.1),
                    color: snowQuality.color,
                    border: `1px solid ${alpha(snowQuality.color, 0.2)}`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Stack>
            </Box>

            <Box sx={{ textAlign: 'right', minWidth: 'fit-content' }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Chip
                  label={weatherData.weather_desc}
                  icon={
                    <Box component="span" sx={{ fontSize: '16px !important' }}>
                      {WEATHER_ICONS[currentCondition] || '☁️'}
                    </Box>
                  }
                  sx={{
                    backgroundColor: alpha(
                      CONDITION_COLORS[currentCondition] || '#6b7280',
                      0.1
                    ),
                    color: CONDITION_COLORS[currentCondition] || '#6b7280',
                    border: `1px solid ${alpha(
                      CONDITION_COLORS[currentCondition] || '#6b7280',
                      0.2
                    )}`,
                    fontWeight: 600,
                    '& .MuiChip-icon': {
                      fontSize: '16px !important',
                    },
                  }}
                  size="small"
                />
                <Tooltip title="Refresh data" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchWeatherData(true);
                    }}
                    disabled={isRefreshing}
                    sx={{
                      opacity: 0.7,
                      '&:hover': { opacity: 1 },
                    }}
                  >
                    <RefreshIcon
                      sx={{
                        fontSize: 18,
                        animation: isRefreshing
                          ? 'spin 1s linear infinite'
                          : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' },
                        },
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  lineHeight: 1,
                  fontSize: '2rem',
                }}
              >
                {formatTemp(weatherData.temp_c)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Snow Metrics Grid */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
            }}
          >
            {/* 24h Fresh Snow */}
            <Box
              sx={{
                p: 2.5,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            >
              <Typography
                variant="caption"
                color="primary.main"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem',
                }}
              >
                24h Fresh
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'primary.main',
                  mt: 0.5,
                  fontSize: '1.5rem',
                }}
              >
                {formatDepth(weatherData.freshsnow_cm)}
              </Typography>
            </Box>

            {/* 7-Day Total */}
            <Box
              sx={{
                p: 2.5,
                backgroundColor: alpha(theme.palette.success.main, 0.05),
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: theme.palette.success.main,
                },
              }}
            >
              <Typography
                variant="caption"
                color="success.main"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem',
                }}
              >
                7-Day Total
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'success.main',
                  mt: 0.5,
                  fontSize: '1.5rem',
                }}
              >
                {formatDepth(totalWeekSnow)}
              </Typography>
            </Box>

            {/* Base Depth */}
            <Box
              sx={{
                p: 2.5,
                backgroundColor: alpha(theme.palette.text.primary, 0.03),
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem',
                }}
              >
                Base Depth
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  mt: 0.5,
                  fontSize: '1.5rem',
                }}
              >
                {formatDepth(weatherData.base_depth)}
              </Typography>
            </Box>

            {/* Summit Depth */}
            <Box
              sx={{
                p: 2.5,
                backgroundColor: alpha(theme.palette.text.primary, 0.03),
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={700}
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: '0.75rem',
                }}
              >
                Summit Depth
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: 'text.primary',
                  mt: 0.5,
                  fontSize: '1.5rem',
                }}
              >
                {formatDepth(weatherData.upper_depth)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* 7-Day Snow Chart */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ChartIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="text.primary"
                sx={{ fontSize: '0.875rem' }}
              >
                7-Day Snowfall
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {totalWeekSnow.toFixed(0)}cm total
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'end',
              height: 80,
              p: 2,
              backgroundColor: alpha(theme.palette.text.primary, 0.02),
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {weatherData.historical_snow.map((day, index) => (
              <Tooltip
                key={day.date}
                title={`${day.snow_cm}cm on ${new Date(
                  day.date
                ).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}`}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: 6,
                      height: Math.max(
                        (day.snow_cm / maxHistoricalSnow) * 50,
                        6
                      ),
                      background:
                        day.snow_cm > 15
                          ? `linear-gradient(to top, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
                          : day.snow_cm > 8
                          ? `linear-gradient(to top, ${theme.palette.info.main}, ${theme.palette.info.light})`
                          : day.snow_cm > 2
                          ? `linear-gradient(to top, ${theme.palette.warning.main}, ${theme.palette.warning.light})`
                          : `linear-gradient(to top, ${theme.palette.grey[400]}, ${theme.palette.grey[300]})`,
                      borderRadius: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'scaleY(1.1)',
                        filter: 'brightness(1.1)',
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    {(() => {
                      const dayDate = new Date(day.date);
                      const today = new Date();

                      // Check if this day is today (same year, month, and day)
                      const isToday =
                        dayDate.getFullYear() === today.getFullYear() &&
                        dayDate.getMonth() === today.getMonth() &&
                        dayDate.getDate() === today.getDate();

                      return isToday
                        ? 'Today'
                        : dayDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                          });
                    })()}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mx: 2 }} />

        {/* 5-Day Forecast */}
        <Box sx={{ p: 3, pt: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="text.primary"
            sx={{ mb: 2, fontSize: '0.875rem' }}
          >
            5-Day Forecast
          </Typography>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ overflowX: 'auto', pb: 1 }}
          >
            {weatherData.forecast.map((day, index) => {
              const dayDate = new Date(day.date);
              const today = new Date();

              // Check if this day is today (same year, month, and day)
              const isToday =
                dayDate.getFullYear() === today.getFullYear() &&
                dayDate.getMonth() === today.getMonth() &&
                dayDate.getDate() === today.getDate();

              return (
                <Box
                  key={day.date}
                  sx={{
                    minWidth: 80,
                    textAlign: 'center',
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: isToday
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.text.primary, 0.02),
                    border: `1px solid ${
                      isToday
                        ? alpha(theme.palette.primary.main, 0.15)
                        : theme.palette.divider
                    }`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                  >
                    {(() => {
                      const dayDate = new Date(day.date);
                      const today = new Date();

                      // Check if this day is today (same year, month, and day)
                      const isToday =
                        dayDate.getFullYear() === today.getFullYear() &&
                        dayDate.getMonth() === today.getMonth() &&
                        dayDate.getDate() === today.getDate();

                      return isToday
                        ? 'Today'
                        : dayDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                          });
                    })()}
                  </Typography>
                  <Box sx={{ fontSize: '1.75rem', my: 1, lineHeight: 1 }}>
                    {WEATHER_ICONS[day.condition]}
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color="text.primary"
                    sx={{ fontSize: '0.875rem' }}
                  >
                    {Math.round(day.temp_high_c)}°/{Math.round(day.temp_low_c)}°
                  </Typography>
                  <Typography
                    variant="caption"
                    color="primary.main"
                    fontWeight={700}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {day.freshsnow_cm > 0 ? `${day.freshsnow_cm}cm` : '—'}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ mx: 2 }} />

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 2,
            backgroundColor: alpha(theme.palette.text.primary, 0.02),
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 'auto',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <WindIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={500}
              >
                {weatherData.wind_speed_mph} mph
              </Typography>
            </Box>
          </Stack>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Updated{' '}
            {new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
