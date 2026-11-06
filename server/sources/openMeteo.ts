// Open-Meteo — free, no-key weather/forecast (moved server-side from the old
// client apiClient). Snowfall is requested in cm, snow depth in metres, wind in
// mph. The model picks the grid cell's own elevation, so a point on Mt Rose
// (≈2,780 m) already reads as a mountain-top forecast.

import { fetchJson } from '../lib/http';
import type { Condition, HourlyPoint, NormalizedWeather, Sourced } from '../lib/types';

export interface OpenMeteoRaw {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    snowfall_sum: number[];
    wind_speed_10m_max?: number[];
    wind_gusts_10m_max?: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    snow_depth: number[];
    snowfall?: number[];
    wind_speed_10m?: number[];
    wind_gusts_10m?: number[];
    freezing_level_height?: number[];
  };
}

const PAST_DAYS = 14;
const FORECAST_DAYS = 5;

function snowfallToCondition(cm: number): Condition {
  if (cm > 1) return 'snow';
  if (cm > 0.1) return 'partly-cloudy';
  return 'cloudy';
}

/** "YYYY-MM-DDTHH" for `now` in the forecast's own time zone. */
export function localHourKey(now: Date, timeZone = 'America/Los_Angeles'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')}T${hour}`;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function normalizeOpenMeteo(
  data: OpenMeteoRaw,
  now = new Date()
): NormalizedWeather {
  const { daily, hourly } = data;
  const todayIdx = Math.min(PAST_DAYS, daily.time.length - 1);

  const forecast = daily.time.slice(todayIdx, todayIdx + FORECAST_DAYS).map((date, k) => {
    const i = todayIdx + k;
    return {
      date,
      temp_high_c: Math.round(daily.temperature_2m_max[i]),
      temp_low_c: Math.round(daily.temperature_2m_min[i]),
      freshsnow_cm: Math.round(daily.snowfall_sum[i] ?? 0),
      wind_mph: Math.round(daily.wind_speed_10m_max?.[i] ?? 0),
      gust_mph: Math.round(daily.wind_gusts_10m_max?.[i] ?? 0),
      condition: snowfallToCondition(daily.snowfall_sum[i] ?? 0),
    };
  });

  // Current hour: match today's date + hour, not just the hour (the hourly
  // series starts PAST_DAYS ago, so a bare hour match lands two weeks back).
  const key = localHourKey(now);
  const idx = hourly.time.findIndex((t) => t.startsWith(key));
  const i = idx >= 0 ? idx : 0;
  const depthM = hourly.snow_depth?.[i] ?? 0;

  const snow_history = daily.time.slice(0, todayIdx).map((date, k) => ({
    date,
    snow_cm: Math.round(daily.snowfall_sum[k] ?? 0),
  }));
  const historical_snow = snow_history.slice(-7);

  const hourlyOut: HourlyPoint[] = hourly.time.slice(i, i + 24).map((time, k) => {
    const j = i + k;
    const fl = hourly.freezing_level_height?.[j];
    return {
      time,
      temp_c: r1(hourly.temperature_2m[j] ?? 0),
      snow_cm: r1(hourly.snowfall?.[j] ?? 0),
      wind_mph: Math.round(hourly.wind_speed_10m?.[j] ?? 0),
      gust_mph: Math.round(hourly.wind_gusts_10m?.[j] ?? 0),
      freezing_level_m: fl == null ? null : Math.round(fl),
    };
  });

  const fl0 = hourly.freezing_level_height?.[i];

  return {
    temp_c: Math.round(hourly.temperature_2m?.[i] ?? 0),
    wind_speed_mph: Math.round(hourly.wind_speed_10m?.[i] ?? 0),
    wind_gust_mph: Math.round(hourly.wind_gusts_10m?.[i] ?? 0),
    freezing_level_m: fl0 == null ? null : Math.round(fl0),
    weather_desc: forecast[0]?.condition ?? 'cloudy',
    freshsnow_cm: Math.round(daily.snowfall_sum[todayIdx] ?? 0),
    base_depth_cm: Math.round(depthM * 100),
    upper_depth_cm: Math.round(depthM * 115), // light model estimate for summit
    forecast,
    historical_snow,
    snow_history,
    hourly: hourlyOut,
  };
}

export async function getWeather(
  lat: number,
  lon: number
): Promise<Sourced<NormalizedWeather>> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'snowfall_sum',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
    ].join(','),
    hourly: [
      'temperature_2m',
      'snow_depth',
      'snowfall',
      'wind_speed_10m',
      'wind_gusts_10m',
      'freezing_level_height',
    ].join(','),
    wind_speed_unit: 'mph',
    timezone: 'America/Los_Angeles',
    forecast_days: String(FORECAST_DAYS),
    past_days: String(PAST_DAYS),
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
