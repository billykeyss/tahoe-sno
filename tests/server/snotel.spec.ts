import { describe, test, expect } from 'vitest';
import { parseSnotel, type AwdbResponse } from '../../server/sources/snotel';

const station = { triplet: '652:NV:SNTL', name: 'Mt Rose Ski Area SNOTEL', elevationFt: 8810 };

const raw: AwdbResponse[] = [
  {
    stationTriplet: '652:NV:SNTL',
    data: [
      {
        stationElement: { elementCode: 'SNWD', storedUnitCode: 'in' },
        values: [
          { date: '2026-11-02', value: 6 },
          { date: '2026-11-03', value: 7 },
          { date: '2026-11-04', value: -1 }, // sensor noise
        ],
      },
      {
        stationElement: { elementCode: 'WTEQ', storedUnitCode: 'in' },
        values: [
          { date: '2026-11-02', value: 1.5 },
          { date: '2026-11-03', value: 1.6 },
          { date: '2026-11-04', value: null },
        ],
      },
      {
        stationElement: { elementCode: 'TOBS', storedUnitCode: 'degF' },
        values: [{ date: '2026-11-03', value: 22.8 }],
      },
    ],
  },
];

describe('parseSnotel', () => {
  test('merges elements by date into a daily series, oldest first, in metric', () => {
    const s = parseSnotel(raw, station, 'high');
    expect(s.history?.map((d) => d.date)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04']);
    expect(s.history?.[1]).toEqual({ date: '2026-11-03', depth_cm: 17.8, swe_cm: 4.1, temp_c: -5.1 });
  });

  test('clamps negative depth to zero and reports the latest readings', () => {
    const s = parseSnotel(raw, station, 'high');
    expect(s.depth_cm).toBe(0); // -1 in clamped
    expect(s.swe_cm).toBe(4.1); // last non-null SWE
    expect(s.stationName).toBe('Mt Rose Ski Area SNOTEL');
    expect(s.elevationFt).toBe(8810);
    expect(s.confidence).toBe('high');
  });

  test('handles an empty payload', () => {
    const s = parseSnotel([], station, 'medium');
    expect(s.depth_cm).toBeNull();
    expect(s.history).toEqual([]);
  });
});
