import type { Sourced, Incident } from '../services/stationData';

const SEV_CLASS: Record<Incident['severity'], string> = {
  High: 'inc-sev-high',
  Unknown: 'inc-sev-high',
  Medium: 'inc-sev-medium',
  Low: 'inc-sev-low',
};

export function IncidentsPanel({ incidents }: { incidents: Sourced<Incident[]> | null }) {
  if (!incidents || incidents.data.length === 0) return null;

  return (
    <div className="alert-banner">
      <span className="alert-tag">ROADS</span>
      <div className="alert-list">
        {incidents.data.map((inc, i) => (
          <div className="inc-row" key={i}>
            <span className={`inc-route ${SEV_CLASS[inc.severity]}`}>{inc.route || inc.type}</span>
            <span className="inc-desc">{inc.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
