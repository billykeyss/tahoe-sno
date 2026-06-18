// Registry of the upstream data sources, used by SourceTip to attribute each
// data point in the UI (name + a link to the provider).

export interface SourceMeta {
  label: string;
  url: string;
  host: string;
  blurb: string;
}

export const SOURCES: Record<string, SourceMeta> = {
  'Open-Meteo': {
    label: 'Open-Meteo',
    url: 'https://open-meteo.com',
    host: 'open-meteo.com',
    blurb: 'Free weather & snowfall forecast model',
  },
  CDEC: {
    label: 'CDEC',
    url: 'https://cdec.water.ca.gov',
    host: 'cdec.water.ca.gov',
    blurb: 'CA Data Exchange Center — snow sensors',
  },
  NWS: {
    label: 'NWS',
    url: 'https://www.weather.gov',
    host: 'weather.gov',
    blurb: 'National Weather Service — alerts',
  },
  Caltrans: {
    label: 'Caltrans',
    url: 'https://quickmap.dot.ca.gov',
    host: 'quickmap.dot.ca.gov',
    blurb: 'Caltrans QuickMap — roads & chain control',
  },
};

export function sourceMeta(name: string): SourceMeta {
  return (
    SOURCES[name] ?? { label: name, url: '#', host: '', blurb: '' }
  );
}
