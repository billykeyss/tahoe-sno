import type { Incident, RoadStatusData, Sourced, WeatherAlert } from '../../services/stationData';
import { MT_ROSE } from '../../config/mtrose';
import { SourceTip } from '../SourceTip';
import { onMtRoseHighway } from './util';

const PASSES = ['I-80', 'US-50', 'SR-89'] as const;
const CHAIN_LABEL: Record<string, string> = {
  none: 'no restrictions',
  R1: 'R-1 chains or 4WD',
  R2: 'R-2 chains required',
  R3: 'R-3 chains, all vehicles',
  unknown: 'no report',
};
const ORDER: Record<string, number> = { none: 0, unknown: 1, R1: 2, R2: 3, R3: 4 };

function worst(controls: RoadStatusData['chainControls'], route: string): string {
  const list = controls.filter((c) => c.route === route);
  if (!list.length) return 'unknown';
  return list.reduce((w, c) => (ORDER[c.status] > ORDER[w] ? c.status : w), 'none');
}

export function AccessPanel({
  incidents,
  roads,
  alerts,
}: {
  incidents: Sourced<Incident[]> | null;
  roads: Sourced<RoadStatusData> | null;
  alerts: Sourced<WeatherAlert[]> | null;
}) {
  const hwy = (incidents?.data ?? []).filter(onMtRoseHighway);

  return (
    <section className="rose-panel">
      <header className="rose-panel-head">
        <h2>Getting there</h2>
        <span className="rose-src">NV511 · NWS · Caltrans</span>
      </header>

      <div className="access-hwy">
        <div className="access-route">
          <span className="access-route-name">{MT_ROSE.highway}</span>
          <span className="access-route-sub">{MT_ROSE.highwayName}, Reno to Incline</span>
        </div>
        {!incidents ? (
          <span className="access-status muted">checking…</span>
        ) : hwy.length === 0 ? (
          <span className="access-status ok">
            <SourceTip source="NV511" detail="No active incidents, closures or construction reported on SR-431">No incidents reported</SourceTip>
          </span>
        ) : (
          <ul className="access-list">
            {hwy.map((i, k) => (
              <li key={k} className={`sev-${i.severity.toLowerCase()}`}>
                <span className="access-type">{i.type}</span>
                <span className="access-desc">{i.description || i.location}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {alerts && alerts.data.length > 0 && (
        <ul className="access-alerts">
          {alerts.data.slice(0, 3).map((a, k) => (
            <li key={k} className={`sev-${a.severity.toLowerCase()}`}>
              <span className="access-type">{a.event}</span>
              <span className="access-desc">{a.headline}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="access-passes">
        <span className="access-passes-k">Coming from California</span>
        <ul>
          {PASSES.map((r) => {
            const st = roads ? worst(roads.data.chainControls, r) : 'unknown';
            return (
              <li key={r} className={`chain-${st}`}>
                <span className="pass-route">{r}</span>
                <SourceTip source="Caltrans" detail={`Worst active chain control on ${r}`}>
                  <span className="pass-status">{roads ? CHAIN_LABEL[st] : '…'}</span>
                </SourceTip>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
