// Open-Meteo — free, no-key weather/forecast (moved server-side from the old
// client apiClient). Snowfall is requested in cm and snow depth in metres.

import { fetchJson } from '../lib/http';
import type { NormalizedWeather, Sourced } from '../lib/types';

type Condition = NormalizedWeather['forecast'][number]['condition'];

interface OpenMeteoRaw {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    snowfall_sum: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    snow_depth: number[];
  };
}

function snowfallToCondition(cm: number): Condition {
  if (cm > 1) return 'snow';
  if (cm > 0.1) return 'partly-cloudy';
  return 'cloudy';
}

export function normalizeOpenMeteo(
  data: OpenMeteoRaw,
  nowHour = new Date().getHours()
): NormalizedWeather {
  const { daily, hourly } = data;

  const forecast = daily.time.slice(0, 5).map((date, i) => ({
    date,
    temp_high_c: Math.round(daily.temperature_2m_max[i]),
    temp_low_c: Math.round(daily.temperature_2m_min[i]),
    freshsnow_cm: Math.round(daily.snowfall_sum[i] ?? 0),
    condition: snowfallToCondition(daily.snowfall_sum[i] ?? 0),
  }));

  const idx = hourly.time.findIndex((t) => new Date(t).getHours() === nowHour);
  const i = idx >= 0 ? idx : 0;
  const depthM = hourly.snow_depth?.[i] ?? 0;

  const historical_snow = daily.time.slice(-7).map((date, k) => ({
    date,
    snow_cm: Math.round(daily.snowfall_sum[daily.time.length - 7 + k] ?? 0),
  }));

  return {
    temp_c: Math.round(hourly.temperature_2m?.[i] ?? 0),
    wind_speed_mph: 15, // not in this endpoint; placeholder kept from prior behaviour
    weather_desc: forecast[0]?.condition ?? 'cloudy',
    freshsnow_cm: Math.round(daily.snowfall_sum[0] ?? 0),
    base_depth_cm: Math.round(depthM * 100),
    upper_depth_cm: Math.round(depthM * 115), // light model estimate for summit
    forecast,
    historical_snow,
  };
}

export async function getWeather(
  lat: number,
  lon: number
): Promise<Sourced<NormalizedWeather>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'temperature_2m_max,temperature_2m_min,snowfall_sum',
    hourly: 'temperature_2m,snow_depth',
    timezone: 'America/Los_Angeles',
    forecast_days: '5',
    past_days: '7',
  });

  const raw = await fetchJson<OpenMeteoRaw>(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { timeoutMs: 10000 }
  );

  return {
    data: normalizeOpenMeteo(raw),
    source: 'Open-Meteo',
    fetchedAt: new Date().toISOString(),
  };
}
