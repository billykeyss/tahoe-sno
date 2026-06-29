import type { Sourced, Fire } from '../services/stationData';

export function FirePanel({ fires }: { fires: Sourced<Fire[]> | null }) {
  if (!fires || fires.data.length === 0) return null;

  return (
    <div className="alert-banner fire-panel" role="alert">
      <span className="alert-tag">FIRE</span>
      <div className="alert-list" style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div className="alert-list">
            {fires.data.map((f, i) => (
              <div className="alert-row" key={i}>
                <span className="alert-sev">{f.name}</span>
                <span className="fire-row-meta">
                  {f.acres.toLocaleString()} ac · {f.containment}% contained · {f.type}
                </span>
              </div>
            ))}
          </div>
          <a
            href="https://emergencywashoe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="fire-link"
          >
            Emergency Washoe ↗
          </a>
        </div>
      </div>
    </div>
  );
}
