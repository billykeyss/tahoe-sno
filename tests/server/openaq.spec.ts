import { describe, test, expect } from 'vitest';
import { pm25Category, parseAQI } from '../../server/sources/openaq';

describe('pm25Category', () => {
  test.each([
    [0, 'Good'],
    [12, 'Good'],
    [12.1, 'Moderate'],
    [35.4, 'Moderate'],
    [35.5, 'Unhealthy for Sensitive Groups'],
    [55.5, 'Unhealthy'],
    [150.5, 'Very Unhealthy'],
    [250.5, 'Hazardous'],
  ] as const)('pm25=%f → %s', (pm25, expected) => {
    expect(pm25Category(pm25)).toBe(expected);
  });
});

describe('parseAQI (AirNow format)', () => {
  const makeObs = (aqi = 42, paramName = 'PM2.5', catName = 'Good') => [
    {
      DateObserved: '2026-06-29',
      HourObserved: 14,
      ReportingArea: 'Reno',
      ParameterName: paramName,
      AQI: aqi,
      Category: { Number: 1, Name: catName },
    },
  ];

  test('returns AQIReading for valid PM2.5 observation', () => {
    const result = parseAQI(makeObs(42, 'PM2.5', 'Good'));
    expect(result).toMatchObject({
      pm25: 42,
      category: 'Good',
      stationName: 'Reno',
    });
    expect(result?.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('returns null for empty array', () => {
    expect(parseAQI([])).toBeNull();
  });

  test('skips non-PM2.5 parameters', () => {
    expect(parseAQI(makeObs(55, 'O3', 'Moderate'))).toBeNull();
  });

  test('returns null for unrecognized category name', () => {
    expect(parseAQI(makeObs(42, 'PM2.5', 'Extreme'))).toBeNull();
  });

  test('uses first PM2.5 observation when multiple params present', () => {
    const obs = [
      ...makeObs(55, 'O3', 'Moderate'),
      ...makeObs(42, 'PM2.5', 'Good'),
    ];
    const result = parseAQI(obs);
    expect(result?.pm25).toBe(42);
    expect(result?.category).toBe('Good');
  });
});
