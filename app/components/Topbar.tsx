import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import {
  type ThemeMode,
  getInitialMode,
  getStoredMode,
  getSystemMode,
  applyMode,
  persistMode,
} from '../theme-mode';

function syncTime(): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Los_Angeles',
    }).format(new Date());
  } catch {
    return '--:--';
  }
}

/**
 * Global instrument top bar: brand mark, live status strip, region link, and
 * the light/dark toggle. Owns the theme-mode state; defaults to the OS setting.
 */
export function Topbar() {
  const { pathname } = useLocation();
  const onBC = pathname.startsWith('/bc');
  const navLabel = onBC ? '‹ CA' : 'BC ›';

  // Start from a deterministic value so the prerendered shell and the first
  // client render agree; adopt the real (stored/OS) mode after mount. The inline
  // head script already applied the correct theme to <html> before paint.
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<string>('--:--');

  useEffect(() => {
    setMode(getInitialMode());
    setMounted(true);
  }, []);

  // Keep <html data-theme> in sync once we know the real mode.
  useEffect(() => {
    if (mounted) applyMode(mode);
  }, [mode, mounted]);

  // Follow OS changes until the user makes an explicit choice.
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      if (!getStoredMode()) setMode(getSystemMode());
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Live-ish sync clock.
  useEffect(() => {
    setTime(syncTime());
    const id = setInterval(() => setTime(syncTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const toggle = () => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      persistMode(next);
      return next;
    });
  };

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <Link to="/" className="brand-mark">
            <span className="peak" aria-hidden="true" />
            TahoeSno
          </Link>
          <span className="brand-sub collapse-sm">Sierra Snow Telemetry</span>
        </div>
        <div className="status-strip">
          <span className="stat-item">
            <span className="dot" />
            <span className="stat-val">FEED LIVE</span>
          </span>
          <span className="stat-item collapse-sm">
            <span className="stat-val mono">SYNC {time} PT</span>
          </span>
          <Link className={`topbtn${pathname.startsWith('/reno') ? ' active' : ''}`} to="/reno">
            RENO
          </Link>
          <Link className={`topbtn${pathname === '/bc' ? ' active' : ''}`} to={onBC ? '/' : '/bc'}>
            {navLabel}
          </Link>
          <button
            className="topbtn topbtn-icon"
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            {mode === 'dark' ? (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </svg>
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
