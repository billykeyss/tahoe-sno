import type { Sourced, Incident } from '../services/stationData';

type Layer = 'Closures' | 'Construction' | 'Incidents';

const LAYER_LABEL: Record<string, string> = {
  Closures: 'CLOSURES',
  Construction: 'CONSTRUCTION',
  Incidents: 'INCIDENTS',
};

const SEV_COLOR: Record<Incident['severity'], string> = {
  High:    'var(--danger)',
  Unknown: 'var(--danger)',
  Medium:  'var(--warn)',
  Low:     'var(--ink-3)',
};

// Strip repeated boilerplate NV511 appends to all closures
const FILLER = /\.\s*(All (lanes|ramps) (blocked|closed)[^.]*\.?|All Ramps Closed\.?)/gi;

function shortDesc(desc: string): string {
  return desc.replace(FILLER, '').trim().replace(/\.$/, '');
}

export function IncidentsPanel({ incidents }: { incidents: Sourced<Incident[]> | null }) {
  if (!incidents || incidents.data.length === 0) return null;

  // Group by layer type
  const groups = new Map<string, Incident[]>();
  for (const inc of incidents.data) {
    const key = LAYER_LABEL[inc.type] ? inc.type : 'Incidents';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(inc);
  }

  return (
    <div className="reno-panel reno-panel-roads">
      <div className="reno-panel-head">
        <span className="reno-panel-tag">ROADS · NV511</span>
        <span className="reno-panel-src">{incidents.data.length} active</span>
      </div>
      {Array.from(groups.entries()).map(([type, items]) => (
        <div className="inc-group" key={type}>
          <div className="inc-group-head">
            <span className="inc-group-label">{LAYER_LABEL[type] ?? type}</span>
            <span className="inc-group-count">{items.length}</span>
          </div>
          {items.map((inc, i) => (
            <div className="inc-row2" key={i}>
              <span
                className="inc-route2"
                style={{ color: SEV_COLOR[inc.severity] }}
              >
                {inc.route || '—'}
              </span>
              <span className="inc-desc2">{shortDesc(inc.description)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
