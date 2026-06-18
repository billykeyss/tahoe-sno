import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { sourceMeta } from '../services/sources';

interface SourceTipProps {
  /** Source key, e.g. "Open-Meteo" | "CDEC" | "NWS" | "Caltrans". */
  source: string;
  /** What this specific number means. */
  detail?: string;
  children: ReactNode;
}

/**
 * Wraps a data point and, on hover or keyboard focus, shows a tooltip with the
 * metric's meaning, its source, and a link to the provider. The tooltip is
 * rendered through a portal to <body> so the card's `overflow:hidden` +
 * hover `transform` can't clip it.
 */
export function SourceTip({ source, detail, children }: SourceTipProps) {
  const meta = sourceMeta(source);
  const ref = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, below: false });

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const el = ref.current;
    if (el) {
      const r = el.getBoundingClientRect();
      // Flip below when there isn't room above; clamp horizontally so a
      // centered tooltip on an edge column never runs off the viewport.
      const below = r.top < 140;
      const half = 148; // ~half max tooltip width + margin
      const left = Math.min(
        Math.max(r.left + r.width / 2, half),
        window.innerWidth - half
      );
      setPos({ top: below ? r.bottom : r.top, left, below });
    }
    setOpen(true);
  };
  const hideSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <span
      ref={ref}
      className="tip-wrap"
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onFocus={show}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            className={`tip${pos.below ? ' tip-below' : ''}`}
            role="tooltip"
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={() => closeTimer.current && clearTimeout(closeTimer.current)}
            onMouseLeave={hideSoon}
          >
            {detail && <span className="tip-detail">{detail}</span>}
            <span className="tip-src">
              <span className="tip-src-name">{meta.label}</span>
              {meta.url !== '#' && (
                <a
                  className="tip-src-url"
                  href={meta.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {meta.host} ↗
                </a>
              )}
            </span>
          </span>,
          document.body
        )}
    </span>
  );
}
