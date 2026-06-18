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
  const navTo = onBC ? '/' : '/bc';
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
          <Link className="topbtn" to={navTo}>
            {navLabel}
          </Link>
          <button
            className="topbtn"
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            {mode === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </header>
  );
}
