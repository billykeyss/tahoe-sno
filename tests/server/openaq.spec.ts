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

describe('parseAQI', () => {
  const makeResponse = (pm25Value: number, name = 'Reno Station') => ({
    results: [{
      id: 1,
      name,
      sensors: [{
        id: 10,
        parameter: { name: 'pm25' },
        latest: { value: pm25Value, datetime: { utc: new Date().toISOString() } },
      }],
    }],
  });

  test('returns AQIReading for valid PM2.5 data', () => {
    const result = parseAQI(makeResponse(8.5));
    expect(result).toMatchObject({
      pm25: 8.5,
      category: 'Good',
      stationName: 'Reno Station',
    });
    expect(result?.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('returns null when no results', () => {
    expect(parseAQI({ results: [] })).toBeNull();
  });

  test('skips sensors without latest reading', () => {
    const raw = {
      results: [{
        id: 1,
        name: 'Station',
        sensors: [{ id: 10, parameter: { name: 'pm25' }, latest: null }],
      }],
    };
    expect(parseAQI(raw as never)).toBeNull();
  });

  test('skips non-pm25 sensors', () => {
    const raw = {
      results: [{
        id: 1,
        name: 'Station',
        sensors: [{ id: 10, parameter: { name: 'o3' }, latest: { value: 55, datetime: { utc: '' } } }],
      }],
    };
    expect(parseAQI(raw as never)).toBeNull();
  });

  test('returns null when reading is older than 2 hours', () => {
    const oldTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const raw = makeResponse(8.5, 'Reno Station');
    raw.results[0].sensors[0].latest.datetime.utc = oldTime;
    expect(parseAQI(raw)).toBeNull();
  });
});
