// Per-resort → nearest CDEC snow-sensor station, from verified research
// (2026-06-18). Resorts not listed have no good CDEC/SNOTEL coverage (e.g.
// SoCal, sparse NV side) and simply won't show a measured snowpack reading.

export interface StationMeta {
  id: string; // CDEC station id
  name: string;
  elevationFt: number;
}

export const CDEC_STATIONS: Record<string, StationMeta> = {
  CSL: { id: 'CSL', name: 'Central Sierra Snow Lab', elevationFt: 6890 },
  WHW: { id: 'WHW', name: 'Ward Creek', elevationFt: 6750 },
  TK2: { id: 'TK2', name: 'Truckee #2', elevationFt: 6500 },
  HVN: { id: 'HVN', name: 'Heavenly Valley', elevationFt: 8540 },
  CAP: { id: 'CAP', name: 'Carson Pass', elevationFt: 8360 },
  MHP: { id: 'MHP', name: 'Mammoth Pass', elevationFt: 9000 },
  GNL: { id: 'GNL', name: 'Gem Lake', elevationFt: 9050 },
};

type Confidence = 'high' | 'medium' | 'low';

export const RESORT_STATION: Record<
  string,
  { station: string; confidence: Confidence }
> = {
  palisades: { station: 'CSL', confidence: 'high' },
  squawcreek: { station: 'CSL', confidence: 'high' },
  sugarbowl: { station: 'CSL', confidence: 'high' },
  boreal: { station: 'CSL', confidence: 'high' },
  soda: { station: 'CSL', confidence: 'high' },
  donner: { station: 'CSL', confidence: 'high' },
  alpine: { station: 'WHW', confidence: 'high' },
  homewood: { station: 'WHW', confidence: 'medium' },
  northstar: { station: 'TK2', confidence: 'medium' },
  tahoedonner: { station: 'TK2', confidence: 'medium' },
  granlibakken: { station: 'TK2', confidence: 'medium' },
  heavenly: { station: 'HVN', confidence: 'high' },
  sierra: { station: 'HVN', confidence: 'medium' },
  diamond: { station: 'HVN', confidence: 'low' },
  mtrose: { station: 'HVN', confidence: 'low' },
  kirkwood: { station: 'CAP', confidence: 'high' },
  bear: { station: 'CAP', confidence: 'medium' },
  mammoth: { station: 'MHP', confidence: 'medium' },
  june: { station: 'GNL', confidence: 'medium' },
};

export function stationForResort(resortId: string): {
  meta: StationMeta;
  confidence: Confidence;
} | null {
  const match = RESORT_STATION[resortId];
  if (!match) return null;
  return { meta: CDEC_STATIONS[match.station], confidence: match.confidence };
}
