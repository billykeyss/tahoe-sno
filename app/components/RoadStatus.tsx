import type { RoadStatusData, Sourced } from '../services/stationData';
import { SourceTip } from './SourceTip';

// Regional mountain-pass status (Caltrans). Roads are regional, not per-resort,
// so this sits above the resort grid.

const ROUTES = ['I-80', 'US-50', 'SR-89'] as const;

const STATUS_LABEL: Record<string, string> = {
  none: 'No restrictions',
  R1: 'R-1 · chains or 4WD',
  R2: 'R-2 · chains required',
  R3: 'R-3 · chains all vehicles',
  unknown: '—',
};

const STATUS_CLASS: Record<string, string> = {
  none: 'ok',
  R1: 'warn',
  R2: 'warn',
  R3: 'danger',
  unknown: '',
};

const ORDER: Record<string, number> = { none: 0, unknown: 1, R1: 2, R2: 3, R3: 4 };

function worstStatus(
  controls: RoadStatusData['chainControls'],
  route: string
): string {
  const forRoute = controls.filter((c) => c.route === route);
  if (!forRoute.length) return 'unknown';
  return forRoute.reduce(
    (worst, c) => (ORDER[c.status] > ORDER[worst] ? c.status : worst),
    'none'
  );
}

export function RoadStatus({
  roads,
  loading,
}: {
  roads: Sourced<RoadStatusData> | null;
  loading: boolean;
}) {
  return (
    <section className="roads">
      <div className="sec-head">
        <h2>Mountain Passes</h2>
        <span className="rule" />
        <span className="count">
          {roads ? `SRC ${roads.source.toUpperCase()}` : 'CALTRANS'}
        </span>
      </div>
      <div className="roads-grid">
        {ROUTES.map((route) => {
          const status = roads ? worstStatus(roads.data.chainControls, route) : 'unknown';
          const closures = roads
            ? roads.data.closures.filter((c) => c.route === route).length
            : 0;
          return (
            <div className="road" key={route}>
              <div className="road-route">{route}</div>
              <div className={`road-status ${STATUS_CLASS[status]}`}>
                <SourceTip
                  source="Caltrans"
                  detail={`Current chain control / restriction level on ${route}`}
                >
                  {loading && !roads ? '…' : STATUS_LABEL[status]}
                </SourceTip>
              </div>
              <div className="road-closures">
                <SourceTip
                  source="Caltrans"
                  detail={`Lane/road closures on ${route} (current + scheduled next 7 days)`}
                >
                  {closures} closure{closures !== 1 ? 's' : ''}
                </SourceTip>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
