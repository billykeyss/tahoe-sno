import { describe, test, expect, vi, afterEach } from 'vitest';
import {
  isSkiAPIConfigured,
  getRapidAPIKey,
  resortAPIService,
} from '../../app/services/resortAPIs';

describe('SkiAPI configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('getRapidAPIKey reads and trims the key from VITE_RAPIDAPI_KEY', () => {
    vi.stubEnv('VITE_RAPIDAPI_KEY', '  abc123realkey  ');
    expect(getRapidAPIKey()).toBe('abc123realkey');
  });

  test('isSkiAPIConfigured is false for the committed placeholder key', () => {
    vi.stubEnv('VITE_RAPIDAPI_KEY', 'your-rapidapi-key-here');
    expect(isSkiAPIConfigured()).toBe(false);
  });

  test('isSkiAPIConfigured is false when the key is empty/unset', () => {
    vi.stubEnv('VITE_RAPIDAPI_KEY', '');
    expect(isSkiAPIConfigured()).toBe(false);
  });

  test('isSkiAPIConfigured is true when a real key is provided', () => {
    vi.stubEnv('VITE_RAPIDAPI_KEY', 'abc123realkey');
    expect(isSkiAPIConfigured()).toBe(true);
  });
});

describe('getResortData source gating', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test('returns null for a SkiAPI-only resort when no key is configured, without attempting a fetch', async () => {
    vi.stubEnv('VITE_RAPIDAPI_KEY', '');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await resortAPIService.getResortData('Heavenly');

    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('returns a structured report from a free source regardless of the key', async () => {
    vi.stubEnv('VITE_RAPIDAPI_KEY', '');

    const result = await resortAPIService.getResortData('Sugar Bowl');

    expect(result).not.toBeNull();
    expect(result?.source).toBe('Sugar Bowl Direct');
    expect(result?.liftsTotal).toBeGreaterThan(0);
  });
});
