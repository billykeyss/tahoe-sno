import { useWeatherStore } from '../services/weatherStore';
import { rankByConditions, snowQuality } from '../services/conditions';
import type { WeatherData } from '../services/apiClient';
import type { Resort } from './ResortGrid';

const cmToIn = (cm: number) => Math.round(cm * 0.393701);

/**
 * "Best Conditions Today" — top 3 resorts ranked by the composite conditions
 * score. Spans all resorts in the country regardless of the active region tab.
 */
export function BestConditions() {
  const { resorts, entries } = useWeatherStore();

  const loaded = resorts
    .map((resort) => ({ resort, data: entries[resort.id]?.data }))
    .filter(
      (x): x is { resort: Resort; data: WeatherData } => x.data !== undefined
    );

  // Wait until at least a few stations report so the ranking is meaningful.
  if (loaded.length < 3) return null;

  const top = rankByConditions(loaded, 3);

  return (
    <section className="best">
      <div className="sec-head">
        <h2>Best Conditions Today</h2>
        <span className="rule" />
        <span className="count">RANKED BY OVERALL CONDITIONS</span>
      </div>
      <div className="best-list">
        {top.map((item, i) => {
          const q = snowQuality(item.data.freshsnow_cm);
          return (
            <div className="best-row" key={item.resort.id}>
              <span className="best-rank">{String(i + 1).padStart(2, '0')}</span>
              <div className="best-main">
                <div className="best-name">{item.resort.name}</div>
                <div className="best-stats">
                  <span className="best-fresh">
                    {item.data.freshsnow_cm}cm
                  </span>{' '}
                  fresh · {Math.round(item.data.base_depth)}cm base ·{' '}
                  <span style={{ color: q.color }}>{q.label}</span>
                </div>
              </div>
              <div className="best-score">
                <span className="best-score-v">{item.score}</span>
                <span className="best-score-k">score</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
