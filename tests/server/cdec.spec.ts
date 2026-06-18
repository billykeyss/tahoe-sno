import { describe, test, expect } from 'vitest';
import { parseCdecSnowpack, type CdecRow } from '../../server/sources/cdec';

const meta = { id: 'HVN', name: 'Heavenly Valley', elevationFt: 8540 };

describe('parseCdecSnowpack', () => {
  test('takes the latest non-missing depth + SWE and converts inches to cm', () => {
    const rows: CdecRow[] = [
      { stationId: 'HVN', SENSOR_NUM: 18, date: '2025-12-15 00:00', value: 3, units: 'INCHES' },
      { stationId: 'HVN', SENSOR_NUM: 18, date: '2025-12-16 00:00', value: 10, units: 'INCHES' },
      { stationId: 'HVN', SENSOR_NUM: 3, date: '2025-12-16 00:00', value: 1.9, units: 'INCHES' },
    ];

    const snow = parseCdecSnowpack(rows, meta, 'high');

    expect(snow.depth_cm).toBe(25.4); // latest depth = 10 in
    expect(snow.swe_cm).toBe(4.8); // 1.9 in * 2.54, rounded to 1 dp
    expect(snow.stationName).toBe('Heavenly Valley');
    expect(snow.elevationFt).toBe(8540);
    expect(snow.confidence).toBe('high');
  });

  test('ignores the -9999 missing sentinel, using the last valid reading', () => {
    const rows: CdecRow[] = [
      { stationId: 'HVN', SENSOR_NUM: 18, date: '2025-12-15 00:00', value: 8, units: 'INCHES' },
      { stationId: 'HVN', SENSOR_NUM: 18, date: '2025-12-16 00:00', value: -9999, units: 'INCHES' },
    ];

    const snow = parseCdecSnowpack(rows, meta, 'high');

    expect(snow.depth_cm).toBe(20.3); // 8 in * 2.54, rounded to 1 dp, -9999 ignored
  });

  test('clamps physically-impossible negative readings to 0 (sensor noise)', () => {
    const rows: CdecRow[] = [
      { stationId: 'CAP', SENSOR_NUM: 3, date: '2026-06-18 00:00', value: -0.94, units: 'INCHES' },
    ];

    const snow = parseCdecSnowpack(rows, meta, 'high');

    expect(snow.swe_cm).toBe(0);
  });

  test('returns null fields when a sensor has no valid data', () => {
    const snow = parseCdecSnowpack([], meta, 'low');

    expect(snow.depth_cm).toBeNull();
    expect(snow.swe_cm).toBeNull();
    expect(snow.confidence).toBe('low');
  });
});
