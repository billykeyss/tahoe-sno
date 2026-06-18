import type { Sourced, WeatherAlert } from '../services/stationData';
import { SourceTip } from './SourceTip';

// Active NWS weather alerts for the region. Renders nothing when there are none
// (the common case outside storm cycles), so it stays out of the way.

export function AlertBanner({ alerts }: { alerts: Sourced<WeatherAlert[]> | null }) {
  if (!alerts || alerts.data.length === 0) return null;

  return (
    <div className="alert-banner" role="alert">
      <span className="alert-tag">{alerts.source}</span>
      <div className="alert-list">
        {alerts.data.slice(0, 3).map((a, i) => (
          <div className="alert-row" key={i}>
            <SourceTip source="NWS" detail={`${a.severity} weather alert · National Weather Service`}>
              <span className={`alert-sev sev-${a.severity.toLowerCase()}`}>
                {a.event}
              </span>
            </SourceTip>
            <span className="alert-head">{a.headline}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
