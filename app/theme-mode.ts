// Light/dark mode controller for the Alpine Instrument theme.
// Defaults to the OS preference; an explicit user choice is persisted and wins.

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'tahoesno-theme';

/** The OS-level preference (defaults to dark, the instrument default). */
export function getSystemMode(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

/** A persisted explicit choice, or null when none has been made. */
export function getStoredMode(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/** Stored choice if present, otherwise the system preference. */
export function getInitialMode(): ThemeMode {
  return getStoredMode() ?? getSystemMode();
}

/** Reflect the mode onto <html data-theme> so the CSS variables switch. */
export function applyMode(mode: ThemeMode): void {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = mode;
  }
}

export function persistMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — fall back to in-memory only */
  }
}

/**
 * Inline script (stringified) injected into <head> so the correct theme is set
 * before first paint, avoiding a flash of the wrong mode.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('${STORAGE_KEY}');if(m!=='light'&&m!=='dark'){m=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=m;}catch(e){document.documentElement.dataset.theme='dark';}})();`;
