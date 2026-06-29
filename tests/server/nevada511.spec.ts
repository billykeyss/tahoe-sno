import { describe, test, expect } from 'vitest';
import { severityMap, parseDetail } from '../../server/sources/nevada511';
import type { NvRoadsDetail } from '../../server/sources/nevada511';

describe('severityMap', () => {
  test.each([
    ['Minor', 'Low'],
    ['minor', 'Low'],
    ['Moderate', 'Medium'],
    ['Major', 'High'],
    ['Unknown', 'Unknown'],
    [undefined, 'Unknown'],
    ['Catastrophic', 'Unknown'],
  ] as const)('%s → %s', (input, expected) => {
    expect(severityMap(input)).toBe(expected);
  });
});

describe('parseDetail', () => {
  const makeDetail = (overrides: Partial<NvRoadsDetail> = {}): NvRoadsDetail => ({
    description: 'Lane closure on I-80',
    roadway: 'I-80',
    eventType: 'roadwork',
    severity: 'Minor',
    startDate: '2026-06-27T08:00:00Z',
    locationDescription: 'Reno, NV',
    ...overrides,
  });

  test('maps a detail response to Incident shape', () => {
    const result = parseDetail(makeDetail(), 'Construction');
    expect(result).toMatchObject({
      type: 'Construction',
      description: 'Lane closure on I-80',
      route: 'I-80',
      location: 'Reno, NV',
      severity: 'Low',
    });
    expect(result.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('uses layer as type', () => {
    expect(parseDetail(makeDetail(), 'Incidents').type).toBe('Incidents');
    expect(parseDetail(makeDetail(), 'Closures').type).toBe('Closures');
  });

  test('handles missing optional fields gracefully', () => {
    const result = parseDetail(makeDetail({ roadway: undefined, locationDescription: undefined }), 'Incidents');
    expect(result.route).toBe('');
    expect(result.location).toBe('');
  });

  test('defaults missing startDate to epoch', () => {
    const result = parseDetail(makeDetail({ startDate: undefined }), 'Incidents');
    expect(result.startTime).toBe(new Date(0).toISOString());
  });
});
