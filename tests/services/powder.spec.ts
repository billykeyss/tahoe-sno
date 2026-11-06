import { describe, test, expect } from 'vitest';
import type { WeatherData } from '../../app/services/apiClient';
import type { Snowpack } from '../../app/services/stationData';
import {
  analyzePowder,
  newSnowDensity,
  snowLevelFt,
  verdictFor,
} from '../../app/services/powder';

const ELEV = { base: 8260, summit: 9700 };

const day = (date: string, snow_cm: number) => ({ date, snow_cm });

const weather = (o: Partial<WeatherData> = {}): WeatherData => ({
  base_depth: 40,
  upper_depth: 46,
  freshsnow_cm: 0,
  weather_desc: 'cloudy',
  temp_c: -5,
  wind_speed_mph: 8,
  wind_gust_mph: 12,
  freezing_level_m: 2000,
  forecast: [
    { date: '2026-01-10', temp_high_c: -2, temp_low_c: -9, freshsnow_cm: 0, wind_speed_mph: 8, gust_mph: 12, condition: 'cloudy' },
    { date: '2026-01-11', temp_high_c: -3, temp_low_c: -10, freshsnow_cm: 12, wind_speed_mph: 20, gust_mph: 35, condition: 'snow' },
    { date: '2026-01-12', temp_high_c: -6, temp_low_c: -12, freshsnow_cm: 25, wind_speed_mph: 25, gust_mph: 40, condition: 'snow' },
  ],
  historical_snow: [day('2026-01-08', 0), day('2026-01-09', 0)],
  snow_history: [day('2026-01-08', 0), day('2026-01-09', 0)],
  hourly: [],
  ...o,
});

const snotel = (history: Snowpack['history']): Snowpack => ({
  depth_cm: history?.[history.length - 1]?.depth_cm ?? null,
  swe_cm: history?.[history.length - 1]?.swe_cm ?? null,
  stationName: 'Mt Rose Ski Area SNOTEL',
  elevationFt: 8810,
  confidence: 'high',
  history,
});

describe('snowLevelFt', () => {
  test('sits ~300 m below the freezing level, in feet', () => {
    expect(snowLevelFt(2818)).toBe(Math.round(2518 * 3.28084));
    expect(snowLevelFt(null)).toBeNull();
  });
});

describe('newSnowDensity', () => {
  test('reads density from the latest day the depth grew', () => {
    const d = newSnowDensity([
      { date: '2026-01-08', depth_cm: 50, swe_cm: 12, temp_c: -4 },
      { date: '2026-01-09', depth_cm: 70, swe_cm: 14, temp_c: -6 }, // +20 cm, +2 cm SWE → 10%
      { date: '2026-01-10', depth_cm: 68, swe_cm: 14, temp_c: -2 }, // settling, ignored
    ]);
    expect(d).toBe(10);
  });

  test('returns null without a growth day', () => {
    expect(newSnowDensity([{ date: 'a', depth_cm: 10, swe_cm: 3, temp_c: 0 }])).toBeNull();
    expect(newSnowDensity(undefined)).toBeNull();
  });
});

describe('analyzePowder', () => {
  test('a dry week with a thin base scores low and says so', () => {
    const a = analyzePowder(weather(), null, ELEV);
    expect(a.storm48_cm).toBe(0);
    expect(a.score).toBeLessThan(50);
    expect(a.factors.find((f) => f.key === 'fresh')?.score).toBe(0);
    expect(a.factors.find((f) => f.key === 'base')?.value).toContain('modeled');
  });

  test('a cold 30 cm storm on a deep measured base is a powder day', () => {
    const w = weather({
      freshsnow_cm: 12,
      snow_history: [day('2026-01-08', 2), day('2026-01-09', 20)],
      temp_c: -9,
      freezing_level_m: 1800,
    });
    const s = snotel([
      { date: '2026-01-08', depth_cm: 150, swe_cm: 50, temp_c: -5 },
      { date: '2026-01-09', depth_cm: 180, swe_cm: 52.4, temp_c: -9 }, // 8% water
    ]);
    const a = analyzePowder(w, s, ELEV);
    expect(a.storm48_cm).toBe(32);
    expect(a.densityPct).toBe(8);
    expect(a.score).toBeGreaterThanOrEqual(80);
    expect(a.verdict).toBe('Powder day');
    expect(a.factors.find((f) => f.key === 'base')?.value).toBe('180 cm measured');
  });

  test('strong gusts pull the score down and flag lift holds', () => {
    const calm = analyzePowder(weather(), null, ELEV);
    const windy = analyzePowder(weather({ wind_speed_mph: 35, wind_gust_mph: 55 }), null, ELEV);
    expect(windy.score).toBeLessThan(calm.score);
    expect(windy.factors.find((f) => f.key === 'wind')?.note).toMatch(/hold/i);
  });

  test('a snow level above the summit means rain', () => {
    const a = analyzePowder(weather({ freezing_level_m: 3400 }), null, ELEV);
    const f = a.factors.find((x) => x.key === 'snowline');
    expect(f?.note).toMatch(/rain/i);
    expect(f?.score).toBe(0);
  });

  test('reports incoming snow, the best day, and when it starts', () => {
    const w = weather({
      hourly: [
        { time: 't0', temp_c: -3, snow_cm: 0, wind_mph: 5, gust_mph: 8, freezing_level_m: 2000 },
        { time: 't1', temp_c: -3, snow_cm: 0, wind_mph: 5, gust_mph: 8, freezing_level_m: 2000 },
        { time: 't2', temp_c: -4, snow_cm: 0.8, wind_mph: 9, gust_mph: 15, freezing_level_m: 1900 },
      ],
    });
    const a = analyzePowder(w, null, ELEV);
    expect(a.incoming_cm).toBe(37);
    expect(a.bestDay).toEqual({ date: '2026-01-12', snow_cm: 25 });
    expect(a.snowStartsInHours).toBe(2);
  });
});

describe('verdictFor', () => {
  test('maps score bands to plain labels', () => {
    expect(verdictFor(85)).toBe('Powder day');
    expect(verdictFor(65)).toBe('Good turns');
    expect(verdictFor(45)).toBe('Fair — groomers');
    expect(verdictFor(25)).toBe('Thin cover');
    expect(verdictFor(5)).toBe('Not yet');
  });
});
