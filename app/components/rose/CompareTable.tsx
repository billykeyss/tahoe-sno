import { Link } from 'react-router';
import { useWeatherStore } from '../../services/weatherStore';
import { snowQuality } from '../../services/conditions';
import { MT_ROSE } from '../../config/mtrose';

const TAHOE_REGIONS = new Set(['North Lake Tahoe', 'South Lake Tahoe', 'West Shore']);

export function CompareTable() {
  const { resorts, entries } = useWeatherStore();
  const rows = resorts
    .filter((r) => TAHOE_REGIONS.has(r.region))
    .map((r) => ({ r, w: entries[r.id]?.data, loading: entries[r.id]?.loading }))
    .sort((a, b) => {
      const fa = a.w?.freshsnow_cm ?? -1;
      const fb = b.w?.freshsnow_cm ?? -1;
      if (fb !== fa) return fb - fa;
      return (b.w?.base_depth ?? 0) - (a.w?.base_depth ?? 0);
    });

  return (
    <section className="rose-section">
      <div className="sec-head">
        <h2>Around the lake</h2>
        <span className="rule" />
        <Link className="sec-link" to="/resorts">All Sierra stations →</Link>
      </div>
      <div className="cmp-wrap">
        <table className="cmp">
          <thead>
            <tr>
              <th>Resort</th>
              <th className="num">Today</th>
              <th className="num">7 days</th>
              <th className="num">Base</th>
              <th className="num">Temp</th>
              <th className="num">Summit</th>
              <th>Snow</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ r, w, loading }) => {
              const week = w ? Math.round(w.historical_snow.reduce((s, d) => s + d.snow_cm, 0)) : null;
              const q = w ? snowQuality(w.freshsnow_cm) : null;
              return (
                <tr key={r.id} className={r.id === MT_ROSE.id ? 'is-home' : ''}>
                  <td>
                    <span className="cmp-name">{r.name}</span>
                    <span className="cmp-region">{r.region}</span>
                  </td>
                  <td className={`num${w && w.freshsnow_cm > 0 ? ' snow' : ''}`}>{w ? `${w.freshsnow_cm} cm` : loading ? '…' : '—'}</td>
                  <td className="num">{week != null ? `${week} cm` : '—'}</td>
                  <td className="num">{w ? `${Math.round(w.base_depth)} cm` : '—'}</td>
                  <td className="num">{w ? `${w.temp_c}°` : '—'}</td>
                  <td className="num muted">{r.elevation.summit.toLocaleString()} ft</td>
                  <td>{q ? <span style={{ color: q.color }}>{q.label}</span> : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
