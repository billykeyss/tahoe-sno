// Small fetch helper: sets a descriptive User-Agent (NWS requires one and it's
// polite to the other gov APIs), a timeout, and one retry on 5xx/network error.

import https from 'node:https';

const USER_AGENT = 'TahoeSno/1.0 (https://github.com/billykeyss/tahoe-sno, info@gocapsule.ai)';

interface FetchOpts {
  timeoutMs?: number;
  accept?: string;
  retries?: number;
}

export async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { timeoutMs = 10000, accept = 'application/json', retries = 1 } = opts;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: accept },
        signal: controller.signal,
      });
      if (res.status >= 500) throw new Error(`Upstream ${res.status} for ${url}`);
      if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
      return await res.text();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  return JSON.parse(await fetchText(url, opts)) as T;
}

/**
 * Legacy transport using node:https. Some older gov servers (notably CDEC)
 * reset undici/global-fetch connections (ECONNRESET) but work fine with the
 * classic https client. Use this for those hosts.
 */
export function legacyFetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const { timeoutMs = 12000, accept = 'application/json' } = opts;
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': USER_AGENT, Accept: accept } },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`Upstream ${status} for ${url}`));
          return;
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve(body));
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () =>
      req.destroy(new Error(`Timeout after ${timeoutMs}ms for ${url}`))
    );
  });
}

export async function legacyFetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  return JSON.parse(await legacyFetchText(url, opts)) as T;
}
