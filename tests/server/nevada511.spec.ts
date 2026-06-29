import { describe, test, expect } from 'vitest';
import { parseIncidents } from '../../server/sources/nevada511';

describe('parseIncidents', () => {
  const makeRecord = (overrides: Record<string, unknown> = {}) => ({
    EventType: 'Construction',
    Description: 'Lane closure on I-80',
    Road: 'I-80',
    Location: 'Reno, NV',
    Severity: 'Medium',
    StartDate: '2026-06-27T08:00:00Z',
    ...overrides,
  });

  test('maps a raw record to Incident shape', () => {
    const result = parseIncidents([makeRecord()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'Construction',
      description: 'Lane closure on I-80',
      route: 'I-80',
      location: 'Reno, NV',
      severity: 'Medium',
    });
    expect(result[0].startTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('returns empty array for empty input', () => {
    expect(parseIncidents([])).toEqual([]);
  });

  test('defaults unknown severity to "Unknown"', () => {
    const result = parseIncidents([makeRecord({ Severity: 'Catastrophic' })]);
    expect(result[0].severity).toBe('Unknown');
  });

  test('handles missing optional fields gracefully', () => {
    const result = parseIncidents([makeRecord({ Road: undefined, Location: undefined })]);
    expect(result[0].route).toBe('');
    expect(result[0].location).toBe('');
  });
});
