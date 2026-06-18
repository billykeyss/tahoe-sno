import { describe, test, expect } from 'vitest';
import type { WeatherData } from '../../app/services/apiClient';
import { scoreConditions, rankByConditions } from '../../app/services/conditions';

const weather = (overrides: Partial<WeatherData> = {}): WeatherData => ({
  base_depth: 0,
  upper_depth: 0,
  freshsnow_cm: 0,
  weather_desc: 'cloudy',
  temp_c: -2,
  wind_speed_mph: 10,
  forecast: [],
  historical_snow: [],
  ...overrides,
});

describe('scoreConditions', () => {
  test('rewards fresh snow over a dry resort', () => {
    const fresh = scoreConditions(weather({ freshsnow_cm: 30 }), 9000);
    const dry = scoreConditions(weather({ freshsnow_cm: 0 }), 9000);
    expect(fresh).toBeGreaterThan(dry);
  });

  test('stays within 0..100', () => {
    const huge = scoreConditions(
      weather({
        freshsnow_cm: 200,
        base_depth: 400,
        historical_snow: [{ date: 'd', snow_cm: 300 }],
      }),
      11000
    );
    expect(huge).toBeLessThanOrEqual(100);
    expect(huge).toBeGreaterThanOrEqual(0);
  });

  test('off-season tiebreaker: with no snow, higher summit ranks higher', () => {
    const high = scoreConditions(weather(), 11000);
    const low = scoreConditions(weather(), 6000);
    expect(high).toBeGreaterThan(low);
  });
});

describe('rankByConditions', () => {
  const a = { resort: { id: 'a', elevation: { summit: 9000 } }, data: weather({ freshsnow_cm: 5 }) };
  const b = { resort: { id: 'b', elevation: { summit: 9000 } }, data: weather({ freshsnow_cm: 30 }) };
  const c = { resort: { id: 'c', elevation: { summit: 9000 } }, data: weather({ freshsnow_cm: 15 }) };

  test('sorts by score descending and limits to N', () => {
    const ranked = rankByConditions([a, b, c], 2);
    expect(ranked).toHaveLength(2);
    expect(ranked[0].resort.id).toBe('b');
    expect(ranked[1].resort.id).toBe('c');
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  test('attaches the computed score to each entry', () => {
    const ranked = rankByConditions([b], 1);
    expect(ranked[0].score).toBe(scoreConditions(b.data, 9000));
  });
});
