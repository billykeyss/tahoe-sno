import type { PowderAnalysis } from '../../services/powder';
import { weekday } from './util';

function tone(score: number): string {
  return score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'low';
}

export function PowderPanel({ powder }: { powder: PowderAnalysis | null }) {
  if (!powder) {
    return (
      <section className="rose-panel">
        <header className="rose-panel-head"><h2>Powder analysis</h2></header>
        <div className="skel" style={{ height: 160 }} />
      </section>
    );
  }
  const incoming =
    powder.incoming_cm > 0 && powder.bestDay
      ? `${powder.incoming_cm} cm in the five-day outlook, most of it ${weekday(powder.bestDay.date, { weekday: 'long' })} (${powder.bestDay.snow_cm} cm).`
      : 'Nothing in the five-day outlook.';
  const starts =
    powder.snowStartsInHours == null
      ? null
      : powder.snowStartsInHours === 0
      ? 'Snowing now.'
      : `Snow starts in about ${powder.snowStartsInHours} h.`;

  return (
    <section className="rose-panel">
      <header className="rose-panel-head">
        <h2>Powder analysis</h2>
        <span className="rose-src">Open-Meteo + SNOTEL, weighted</span>
      </header>

      <div className="pow-top">
        <div className={`pow-score is-${tone(powder.score)}`}>
          <span className="pow-num">{powder.score}</span>
          <span className="pow-den">/100</span>
        </div>
        <div className="pow-verdict">
          <div className="pow-verdict-label">{powder.verdict}</div>
          <p className="pow-incoming">
            {incoming} {starts}
          </p>
        </div>
      </div>

      <ul className="pow-factors">
        {powder.factors.map((f) => (
          <li key={f.key} className={`pf is-${tone(f.score)}`}>
            <div className="pf-head">
              <span className="pf-label">{f.label}</span>
              <span className="pf-value">{f.value}</span>
              <span className="pf-weight">{Math.round(f.weight * 100)}%</span>
            </div>
            <div className="pf-bar" aria-hidden="true"><span style={{ width: `${f.score}%` }} /></div>
            <p className="pf-note">{f.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
