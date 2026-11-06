import { MT_ROSE } from '../../config/mtrose';
import { fmt } from './util';

interface Props {
  /** Estimated snow level, ft ASL (null hides the live marker). */
  snowLevelFt: number | null;
  /** Measured depth at the SNOTEL site, cm. */
  snotelDepthCm: number | null;
}

const TOP = 10200;
const BOTTOM = MT_ROSE.elevation.reno - 300;
const W = 150;
const H = 330;
const PAD_T = 18;
const PAD_B = 14;
const LEFT = 58; // label gutter

// Piecewise scale: the valley floor to 7,000 ft gets a quarter of the height,
// the skiable range above it gets the rest, so base/sensor/summit don't crowd.
const KNEE = 7000;
const KNEE_FRAC = 0.25;
const y = (ft: number) => {
  const span = H - PAD_T - PAD_B;
  if (ft >= KNEE) return PAD_T + ((TOP - ft) / (TOP - KNEE)) * span * (1 - KNEE_FRAC);
  return PAD_T + span * (1 - KNEE_FRAC) + ((KNEE - ft) / (KNEE - BOTTOM)) * span * KNEE_FRAC;
};

/**
 * The mountain as a gauge: a profile from Reno to the summit with the live
 * snow level painted across it. White above the line is where precipitation
 * falls as snow — the one picture that answers "is it snowing at the lodge?".
 */
export function ElevationGauge({ snowLevelFt, snotelDepthCm }: Props) {
  const { summit, base, snotel, reno } = MT_ROSE.elevation;
  const yReno = y(reno);
  const ridge = [
    [LEFT + 2, yReno],
    [LEFT + 22, y(6300)],
    [LEFT + 38, y(7600)],
    [LEFT + 50, y(base)],
    [LEFT + 62, y(9050)],
    [LEFT + 72, y(summit)],
    [LEFT + 80, y(9350)],
    [LEFT + 88, y(8700)],
    [W - 4, yReno],
  ];
  const path = ridge.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ') + ' Z';

  const level = snowLevelFt == null ? null : Math.max(BOTTOM, Math.min(TOP, snowLevelFt));
  const ySnow = level == null ? null : y(level);
  const snowBelowBase = snowLevelFt != null && snowLevelFt <= base;

  const marks: Array<{ ft: number; label: string; sub?: string; cls?: string }> = [
    { ft: summit, label: 'Summit', sub: `${fmt(summit)} ft` },
    {
      ft: snotel,
      label: 'Sensor',
      sub: snotelDepthCm == null ? `${fmt(snotel)} ft` : `${Math.round(snotelDepthCm)} cm snow`,
    },
    { ft: base, label: 'Base', sub: `${fmt(base)} ft`, cls: 'is-base' },
    { ft: reno, label: 'Reno', sub: `${fmt(reno)} ft` },
  ];

  return (
    <figure className="gauge" aria-label="Elevation profile from Reno to the Mt Rose summit">
      <svg viewBox={`0 0 ${W} ${H}`} role="img">
        <defs>
          <clipPath id="gauge-snowcap">
            <rect x="0" y="0" width={W} height={ySnow ?? 0} />
          </clipPath>
        </defs>
        {/* bare mountain */}
        <path d={path} className="gauge-rock" />
        {/* snow-covered portion above the snow level */}
        {ySnow != null && <path d={path} className="gauge-snow" clipPath="url(#gauge-snowcap)" />}
        {/* elevation marks */}
        {marks.map((m) => (
          <g key={m.label} className={`gauge-mark ${m.cls ?? ''}`} transform={`translate(0 ${y(m.ft).toFixed(1)})`}>
            <line x1={LEFT - 6} x2={W} y1="0" y2="0" />
            <text x={LEFT - 10} y="-1" textAnchor="end" className="gauge-label">{m.label}</text>
            <text x={LEFT - 10} y="10" textAnchor="end" className="gauge-sub">{m.sub}</text>
          </g>
        ))}
        {/* live snow level */}
        {ySnow != null && snowLevelFt != null && (
          <g className={`gauge-level ${snowBelowBase ? 'ok' : 'warn'}`} transform={`translate(0 ${ySnow.toFixed(1)})`}>
            <line x1={LEFT - 6} x2={W} y1="0" y2="0" />
            <text x={W - 2} y={snowBelowBase ? 11 : -4} textAnchor="end" className="gauge-level-text">
              snow level {fmt(snowLevelFt)} ft
            </text>
          </g>
        )}
      </svg>
    </figure>
  );
}
