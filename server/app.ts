import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { TTLCache } from './lib/cache';
import { getWeather } from './sources/openMeteo';
import { getAlerts } from './sources/nws';
import { getSnowpack } from './sources/cdec';
import { getRoads } from './sources/caltrans';
import { getFires } from './sources/nifc';
import { getAQI } from './sources/openaq';
import { getIncidents } from './sources/nevada511';

const MIN = 60 * 1000;
const cache = new TTLCache();
const STATIC_ROOT = process.env.STATIC_ROOT ?? './build/client';

export const app = new Hono();

const coords = (q: Record<string, string | undefined>) => {
  const lat = Number(q.lat);
  const lon = Number(q.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
};

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.get('/api/weather', async (c) => {
  const p = coords(c.req.query());
  if (!p) return c.json({ error: 'lat & lon required' }, 400);
  try {
    const data = await cache.wrap(`weather:${p.lat},${p.lon}`, 15 * MIN, () =>
      getWeather(p.lat, p.lon)
    );
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'weather upstream failed', detail: String(e) }, 502);
  }
});

app.get('/api/alerts', async (c) => {
  const p = coords(c.req.query());
  if (!p) return c.json({ error: 'lat & lon required' }, 400);
  try {
    const data = await cache.wrap(`alerts:${p.lat},${p.lon}`, 5 * MIN, () =>
      getAlerts(p.lat, p.lon)
    );
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'alerts upstream failed', detail: String(e) }, 502);
  }
});

app.get('/api/snowpack', async (c) => {
  const resortId = c.req.query('resortId');
  if (!resortId) return c.json({ error: 'resortId required' }, 400);
  try {
    const data = await cache.wrap(`snowpack:${resortId}`, 90 * MIN, () =>
      getSnowpack(resortId)
    );
    return c.json(data ?? { data: null }); // null => no mapped station
  } catch (e) {
    return c.json({ error: 'snowpack upstream failed', detail: String(e) }, 502);
  }
});

app.get('/api/roads', async (c) => {
  try {
    const data = await cache.wrap('roads', 5 * MIN, () => getRoads());
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'roads upstream failed', detail: String(e) }, 502);
  }
});

app.get('/api/fires', async (c) => {
  try {
    const data = await cache.wrap('fires', 30 * MIN, () => getFires());
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'fires upstream failed', detail: String(e) }, 502);
  }
});

app.get('/api/aqi', async (c) => {
  try {
    const data = await cache.wrap('aqi', 60 * MIN, () => getAQI());
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'aqi upstream failed', detail: String(e) }, 502);
  }
});

app.get('/api/incidents', async (c) => {
  try {
    const data = await cache.wrap('incidents', 5 * MIN, () => getIncidents());
    return c.json(data);
  } catch (e) {
    return c.json({ error: 'incidents upstream failed', detail: String(e) }, 502);
  }
});

// Static SPA (production self-host). In dev, Vite serves the app and proxies
// only /api here, so these handlers are inert.
app.use('/*', serveStatic({ root: STATIC_ROOT }));
app.get('*', serveStatic({ path: `${STATIC_ROOT}/index.html` })); // SPA fallback

export default app;
