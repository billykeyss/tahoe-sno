import type { Sourced, Fire } from '../services/stationData';

export function FirePanel({ fires }: { fires: Sourced<Fire[]> | null }) {
  if (!fires || fires.data.length === 0) return null;

  return (
    <div className="reno-panel reno-panel-fire" role="alert">
      <div className="reno-panel-head">
        <span className="reno-panel-tag reno-panel-tag-fire">ACTIVE FIRES</span>
        <a
          href="https://emergencywashoe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="reno-panel-src reno-link"
        >
          Emergency Washoe ↗
        </a>
      </div>
      <div className="fire-table">
        {fires.data.map((f, i) => (
          <div className="fire-row" key={i}>
            <span className="fire-name">{f.name}</span>
            <span className="fire-stat">{f.acres.toLocaleString()} ac</span>
            <span className="fire-stat">{f.containment}% contained</span>
            <span className="fire-type">{f.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
