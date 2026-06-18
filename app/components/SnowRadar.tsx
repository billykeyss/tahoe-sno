import { useState } from 'react';

// Lake Tahoe center for the embedded map.
const LAT = 39.09;
const LON = -120.04;
const ZOOM = 8;

type Overlay = 'radar' | 'snow';

function windyUrl(overlay: Overlay): string {
  const params = new URLSearchParams({
    lat: String(LAT),
    lon: String(LON),
    detailLat: String(LAT),
    detailLon: String(LON),
    zoom: String(ZOOM),
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
 * Live snow map — an embedded Windy radar over the Sierra, framed in the
 * instrument chrome. Toggles between live precipitation radar and forecast
 * snowfall accumulation.
 */
export function SnowRadar() {
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
          title="Live snow radar — Sierra Nevada"
          src={windyUrl(overlay)}
          loading="lazy"
        />
      </div>

      <div className="radar-cred">
        WINDY.COM · LAKE TAHOE · SIERRA NEVADA ·{' '}
        {overlay === 'radar' ? 'LIVE PRECIPITATION RADAR' : 'FORECAST SNOWFALL'}
      </div>
    </section>
  );
}
