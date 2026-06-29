import { fetchJson } from '../lib/http';
import type { Sourced, Fire } from '../lib/types';

interface NifcFeature {
  attributes: {
    IncidentName: string;
    GISAcres: number;
    PercentContained: number;
    IncidentTypeCategory: string;
    ModifiedOnDateTime_dt: number | null;
    Latitude: number | null;
    Longitude: number | null;
  };
}

interface NifcResponse {
  features: NifcFeature[];
}

// Reno/Washoe County bounding box: minX,minY,maxX,maxY
const BBOX = '-120.5,39.1,-119.3,40.3';

const FIELDS = [
  'IncidentName', 'GISAcres', 'PercentContained',
  'IncidentTypeCategory', 'ModifiedOnDateTime_dt', 'Latitude', 'Longitude',
].join('%2C');

const NIFC_URL =
  'https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Active_Fires/FeatureServer/0/query' +
  `?where=1%3D1&geometry=${encodeURIComponent(BBOX)}&geometryType=esriGeometryEnvelope` +
  `&spatialRel=esriSpatialRelIntersects&outFields=${FIELDS}&f=json`;

export function parseFires(raw: NifcResponse): Fire[] {
  return (raw.features ?? [])
    .map((f) => ({
      name: f.attributes.IncidentName ?? 'Unknown',
      acres: Math.round(f.attributes.GISAcres ?? 0),
      containment: f.attributes.PercentContained ?? 0,
      type: f.attributes.IncidentTypeCategory ?? 'WF',
      updatedAt: f.attributes.ModifiedOnDateTime_dt != null
        ? new Date(f.attributes.ModifiedOnDateTime_dt).toISOString()
        : new Date(0).toISOString(),
      lat: f.attributes.Latitude ?? null,
      lon: f.attributes.Longitude ?? null,
    }))
    .filter((f) => f.containment < 100);
}

export async function getFires(): Promise<Sourced<Fire[]>> {
  const raw = await fetchJson<NifcResponse>(NIFC_URL, { timeoutMs: 12000 });
  return { data: parseFires(raw), source: 'NIFC', fetchedAt: new Date().toISOString() };
}
