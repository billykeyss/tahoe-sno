import { describe, test, expect } from 'vitest';
import { sourceMeta } from '../../app/services/sources';

describe('sourceMeta', () => {
  test('returns label, url and host for each known source', () => {
    for (const name of ['Open-Meteo', 'CDEC', 'NWS', 'Caltrans']) {
      const m = sourceMeta(name);
      expect(m.label).toBe(name);
      expect(m.url).toMatch(/^https:\/\//);
      expect(m.host.length).toBeGreaterThan(0);
      expect(m.blurb.length).toBeGreaterThan(0);
    }
  });

  test('CDEC points at the real host', () => {
    expect(sourceMeta('CDEC').url).toContain('cdec.water.ca.gov');
  });

  test('falls back gracefully for an unknown source', () => {
    const m = sourceMeta('Mystery');
    expect(m.label).toBe('Mystery');
    expect(m.url).toBe('#');
  });
});
