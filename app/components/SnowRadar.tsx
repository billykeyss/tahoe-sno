import { useState } from 'react';

type Overlay = 'radar' | 'snow';

interface SnowRadarProps {
  /** Map center + zoom. Defaults to Lake Tahoe. */
  lat?: number;
  lon?: number;
  zoom?: number;
  /** Label shown in the credit line. */
  place?: string;
}

function windyUrl(
  overlay: Overlay,
  lat: number,
  lon: number,
  zoom: number
): string {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    detailLat: String(lat),
    detailLon: String(lon),
    zoom: String(zoom),
    level: 'surface',
    overlay,
    product: overlay === 'radar' ? 'radar' : 'ecmwf',
    menu: '',
    message: 'true',
    marker: 'true',
    calendar: 'now',
    pressure: '',
    type: 'map',
    location: 'coordinates',
    detail: '',
    metricWind: 'mph',
    metricTemp: '°F',
    radarRange: '-1',
  });
  return `https://embed.windy.com/embed2.html?${params.toString()}`;
}

/**
 * Live snow map — an embedded Windy radar, framed in the instrument chrome.
 * Toggles between live precipitation radar and forecast snowfall accumulation.
 */
export function SnowRadar({
  lat = 39.09,
  lon = -120.04,
  zoom = 8,
  place = 'Lake Tahoe · Sierra Nevada',
}: SnowRadarProps = {}) {
  const [overlay, setOverlay] = useState<Overlay>('radar');

  return (
    <section className="radar">
      <div className="sec-head">
        <h2>Live Snow Map</h2>
        <span className="rule" />
        <div className="radar-toggle">
          <button
            type="button"
            className={`region-tab${overlay === 'radar' ? ' active' : ''}`}
            onClick={() => setOverlay('radar')}
          >
            Radar
          </button>
          <button
            type="button"
            className={`region-tab${overlay === 'snow' ? ' active' : ''}`}
            onClick={() => setOverlay('snow')}
          >
            Snowfall
          </button>
        </div>
      </div>

      <div className="radar-frame">
        <iframe
          key={overlay}
          title={`Live snow radar — ${place}`}
          src={windyUrl(overlay, lat, lon, zoom)}
          loading="lazy"
        />
      </div>

      <div className="radar-cred">
        WINDY.COM · {place.toUpperCase()} ·{' '}
        {overlay === 'radar' ? 'LIVE PRECIPITATION RADAR' : 'FORECAST SNOWFALL'}
      </div>
    </section>
  );
}
