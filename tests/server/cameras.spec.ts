import { describe, test, expect } from 'vitest';
import { parseCamera } from '../../server/sources/cameras';

describe('parseCamera', () => {
  test('builds absolute still + stream URLs and parses the WKT point', () => {
    const cam = parseCamera('7881', 'Ski area entrance', {
      location: 'SR-431 @ Mt Rose Ski Area',
      images: [{ imageUrl: '/map/Cctv/7881', videoUrl: 'https://x/playlist.m3u8', videoDisabled: false }],
      latLng: { geography: { wellKnownText: 'POINT (-119.8867 39.32983)' } },
    });
    expect(cam.imageUrl).toBe('https://www.nvroads.com/map/Cctv/7881');
    expect(cam.videoUrl).toBe('https://x/playlist.m3u8');
    expect(cam.lat).toBeCloseTo(39.32983);
    expect(cam.lon).toBeCloseTo(-119.8867);
    expect(cam.location).toBe('SR-431 @ Mt Rose Ski Area');
  });

  test('falls back to the still-only entry when the detail call failed', () => {
    const cam = parseCamera('7428', 'Mt Rose Summit', null);
    expect(cam.imageUrl).toBe('https://www.nvroads.com/map/Cctv/7428');
    expect(cam.videoUrl).toBeNull();
    expect(cam.lat).toBeNull();
    expect(cam.location).toBe('SR-431 camera 7428');
  });

  test('drops a disabled video stream', () => {
    const cam = parseCamera('1', 'x', {
      images: [{ imageUrl: '/map/Cctv/1', videoUrl: 'https://x', videoDisabled: true }],
    });
    expect(cam.videoUrl).toBeNull();
  });
});
