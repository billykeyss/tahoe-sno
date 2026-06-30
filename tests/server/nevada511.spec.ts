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
    latitude: 39.5296,
    longitude: -119.8138,
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
      lat: 39.5296,
      lon: -119.8138,
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

  test('returns null lat/lon when coordinates missing', () => {
    const result = parseDetail(makeDetail({ latitude: undefined, longitude: undefined }), 'Incidents');
    expect(result.lat).toBeNull();
    expect(result.lon).toBeNull();
  });

  test('strips "Start time:" suffix from description', () => {
    const raw = 'Crash on I-80. 1 Left lane closed. Start time: 6/28/2026 6:17 AM.  End time: 7/1/2026.';
    const result = parseDetail(makeDetail({ description: raw }), 'Incidents');
    expect(result.description).toBe('Crash on I-80. 1 Left lane closed');
  });

  test('strips leading severity word from description', () => {
    const result = parseDetail(makeDetail({ description: 'Minor Bridge construction on ramp from SR-430.' }), 'Incidents');
    expect(result.description).toBe('Bridge construction on ramp from SR-430.');
  });
});
