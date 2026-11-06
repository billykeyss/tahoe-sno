import { describe, test, expect } from 'vitest';
import { localHourKey, normalizeOpenMeteo, type OpenMeteoRaw } from '../../server/sources/openMeteo';

// 14 past days + 5 forecast days of daily data; hourly for the same span.
function build(): OpenMeteoRaw {
  const days: string[] = [];
  for (let d = 0; d < 19; d++) {
    const dt = new Date(Date.UTC(2026, 0, 1 + d));
    days.push(dt.toISOString().slice(0, 10));
  }
  const hourly = { time: [] as string[], temperature_2m: [] as number[], snow_depth: [] as number[], snowfall: [] as number[], wind_speed_10m: [] as number[], wind_gusts_10m: [] as number[], freezing_level_height: [] as number[] };
  days.forEach((d, di) => {
    for (let h = 0; h < 24; h++) {
      hourly.time.push(`${d}T${String(h).padStart(2, '0')}:00`);
      hourly.temperature_2m.push(di === 14 && h === 9 ? -7.4 : 1);
      hourly.snow_depth.push(di === 14 ? 0.42 : 0.1);
      hourly.snowfall.push(di === 14 && h >= 12 ? 0.5 : 0);
      hourly.wind_speed_10m.push(di === 14 && h === 9 ? 18 : 3);
      hourly.wind_gusts_10m.push(di === 14 && h === 9 ? 31 : 5);
      hourly.freezing_level_height.push(2450);
    }
  });
  return {
    daily: {
      time: days,
      temperature_2m_max: days.map(() => 2),
      temperature_2m_min: days.map(() => -8),
      snowfall_sum: days.map((_, i) => (i === 13 ? 9 : i === 14 ? 4 : i === 16 ? 20 : 0)),
      wind_speed_10m_max: days.map(() => 14),
      wind_gusts_10m_max: days.map(() => 27),
    },
    hourly,
  };
}

// 09:00 Pacific on 2026-01-15.
const NOW = new Date('2026-01-15T17:00:00Z');

describe('localHourKey', () => {
  test('formats the current Pacific hour as an ISO prefix', () => {
    expect(localHourKey(NOW)).toBe('2026-01-15T09');
  });
});

describe('normalizeOpenMeteo', () => {
  test('reads the current hour from today, not from two weeks ago', () => {
    const w = normalizeOpenMeteo(build(), NOW);
    expect(w.temp_c).toBe(-7);
    expect(w.wind_speed_mph).toBe(18);
    expect(w.wind_gust_mph).toBe(31);
    expect(w.freezing_level_m).toBe(2450);
    expect(w.base_depth_cm).toBe(42);
  });

  test('splits 14 days of history and 5 days of forecast around today', () => {
    const w = normalizeOpenMeteo(build(), NOW);
    expect(w.snow_history).toHaveLength(14);
    expect(w.historical_snow).toHaveLength(7);
    expect(w.snow_history[13]).toEqual({ date: '2026-01-14', snow_cm: 9 });
    expect(w.freshsnow_cm).toBe(4); // today
    expect(w.forecast).toHaveLength(5);
    expect(w.forecast[0].date).toBe('2026-01-15');
    expect(w.forecast[2].freshsnow_cm).toBe(20);
    expect(w.forecast[0].gust_mph).toBe(27);
  });

  test('returns the next 24 hours from now with snowfall and wind', () => {
    const w = normalizeOpenMeteo(build(), NOW);
    expect(w.hourly).toHaveLength(24);
    expect(w.hourly[0].time).toBe('2026-01-15T09:00');
    expect(w.hourly[3].snow_cm).toBe(0.5); // 12:00
    expect(w.hourly[0].gust_mph).toBe(31);
  });
});
