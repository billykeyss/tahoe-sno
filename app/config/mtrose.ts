// The home mountain. Everything the dashboard needs to know about Mt Rose that
// isn't live data: where it is, how tall it is, how you get there, and where
// its own cams live.

export const MT_ROSE = {
  id: 'mtrose',
  name: 'Mt Rose',
  fullName: 'Mt Rose Ski Tahoe',
  coordinates: { lat: 39.3181, lon: -119.8862 },
  elevation: {
    base: 8260, // ft — highest base in Tahoe
    summit: 9700,
    snotel: 8810, // Mt Rose Ski Area SNOTEL, inside the boundary
    reno: 4505, // downtown Reno, where the drive starts
  },
  highway: 'SR-431',
  highwayName: 'Mt Rose Highway',
  links: {
    resort: 'https://skirose.com',
    cams: 'https://skirose.com/the-mountain-web-cams/',
    report: 'https://skirose.com/the-mountain/mountain-report/',
    nvroads: 'https://www.nvroads.com',
  },
} as const;

export const FT_PER_M = 3.28084;
export const mToFt = (m: number) => Math.round(m * FT_PER_M);
export const cmToIn = (cm: number) => Math.round(cm * 0.393701 * 10) / 10;
export const cToF = (c: number) => Math.round((c * 9) / 5 + 32);
