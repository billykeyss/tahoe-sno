import type { ReactNode } from 'react';
import { useWeatherAggregates } from '../services/weatherStore';

export interface ReadoutRow {
  label: string;
  value: ReactNode;
  /** Optional value class, e.g. 'acc' for the accent color. */
  cls?: string;
}

/**
 * Hero readout panel. The first two rows (24h max, stations reporting) are
 * derived live from the shared weather store; the rest are passed in as
 * region-specific context (chain control, freezing line, …).
 */
export function RegionReadout({ rows }: { rows: ReadoutRow[] }) {
  const { max24h, reporting, total } = useWeatherAggregates();

  return (
    <div className="readout">
      <div className="readout-row">
        <span className="label">Region 24h max</span>
        <span className="v snow">
          {max24h}
          <span className="unit"> cm</span>
        </span>
      </div>
      <div className="readout-row">
        <span className="label">Stations</span>
        <span className="v">
          {reporting}
          <span className="unit"> / {total}</span>
        </span>
      </div>
      {rows.map((row, i) => (
        <div className="readout-row" key={i}>
          <span className="label">{row.label}</span>
          <span className={`v ${row.cls ?? ''}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
