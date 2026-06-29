import type { Sourced, Incident } from '../services/stationData';

export function IncidentsPanel({ incidents }: { incidents: Sourced<Incident[]> | null }) {
  if (!incidents || incidents.data.length === 0) return null;

  return (
    <div className="alert-banner">
      <span className="alert-tag">NV511</span>
      <div className="alert-list">
        {incidents.data.map((inc, i) => (
          <div className="incident-row" key={i}>
            <span className={`incident-type sev-${inc.severity.toLowerCase()}`}>
              {inc.type}
            </span>
            <span className="incident-desc">
              {inc.route && `${inc.route} · `}{inc.location && `${inc.location} · `}{inc.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
