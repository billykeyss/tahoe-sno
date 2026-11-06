import { useState } from 'react';
import type { Incident, Sourced } from '../../services/stationData';
import { MT_ROSE } from '../../config/mtrose';
import { RenoMap } from '../RenoMap';
import { windyUrl } from '../SnowRadar';

type View = 'terrain' | 'radar' | 'snow';

const CENTER: [number, number] = [MT_ROSE.coordinates.lon, MT_ROSE.coordinates.lat];

/**
 * Map section with three views: 3D terrain with the highway and live incidents,
 * live precipitation radar, and forecast snowfall. The terrain map stays
 * mounted once shown so switching back is instant.
 */
export function RoseMap({ incidents }: { incidents: Sourced<Incident[]> | null }) {
  const [view, setView] = useState<View>('terrain');
  const [terrainSeen, setTerrainSeen] = useState(true);
  const pick = (v: View) => {
    setView(v);
    if (v === 'terrain') setTerrainSeen(true);
  };

  return (
    <section className="rose-section rose-map">
      <div className="sec-head">
        <h2>The mountain and the road</h2>
        <span className="rule" />
        <div className="radar-toggle" role="tablist" aria-label="Map view">
          {(['terrain', 'radar', 'snow'] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              className={`region-tab${view === v ? ' active' : ''}`}
              onClick={() => pick(v)}
            >
              {v === 'terrain' ? 'Terrain' : v === 'radar' ? 'Radar' : 'Snowfall'}
            </button>
          ))}
        </div>
      </div>

      <div className="rose-map-frame">
        {terrainSeen && (
          <div className="rose-map-layer" hidden={view !== 'terrain'}>
            <RenoMap
              incidents={incidents}
              center={CENTER}
              zoom={11.6}
              pitch={62}
              bearing={-28}
              marker={{ lngLat: CENTER, label: 'Mt Rose' }}
              className="rose-map-canvas"
            />
          </div>
        )}
        {view !== 'terrain' && (
          <iframe
            key={view}
            className="rose-map-layer"
            title={view === 'radar' ? 'Live precipitation radar over Mt Rose' : 'Forecast snowfall over Mt Rose'}
            src={windyUrl(view === 'radar' ? 'radar' : 'snow', MT_ROSE.coordinates.lat, MT_ROSE.coordinates.lon, 9)}
            loading="lazy"
          />
        )}
      </div>
      <p className="rose-foot-note">
        {view === 'terrain'
          ? 'Highways colour by current NV511 incident severity. Drag to look around; scroll to zoom.'
          : view === 'radar'
          ? 'Windy.com live precipitation radar.'
          : 'Windy.com forecast snowfall accumulation (ECMWF).'}
      </p>
    </section>
  );
}
