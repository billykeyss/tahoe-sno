import { describe, test, expect } from 'vitest';
import { parseFires } from '../../server/sources/nifc';

const makeFeature = (overrides: Record<string, unknown> = {}) => ({
  attributes: {
    IncidentName: 'Test Fire',
    GISAcres: 1234.5,
    PercentContained: 50,
    IncidentTypeCategory: 'WF',
    ModifiedOnDateTime_dt: 1750000000000,
    Latitude: 39.6,
    Longitude: -119.9,
    ...overrides,
  },
});

describe('parseFires', () => {
  test('maps NIFC feature to Fire shape', () => {
    const result = parseFires({ features: [makeFeature()] });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Test Fire',
      acres: 1235,
      containment: 50,
      type: 'WF',
      lat: 39.6,
      lon: -119.9,
    });
    expect(result[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('excludes fully-contained fires (containment === 100)', () => {
    const result = parseFires({
      features: [makeFeature({ PercentContained: 100 })],
    });
    expect(result).toHaveLength(0);
  });

  test('handles missing features gracefully', () => {
    expect(parseFires({ features: [] })).toEqual([]);
    expect(parseFires({} as never)).toEqual([]);
  });

  test('null lat/lon are passed through', () => {
    const result = parseFires({
      features: [makeFeature({ Latitude: null, Longitude: null })],
    });
    expect(result[0].lat).toBeNull();
    expect(result[0].lon).toBeNull();
  });

  test('handles null ModifiedOnDateTime_dt gracefully', () => {
    const result = parseFires({
      features: [makeFeature({ ModifiedOnDateTime_dt: null })],
    });
    expect(result).toHaveLength(1);
    expect(result[0].updatedAt).toBe(new Date(0).toISOString());
  });
});
