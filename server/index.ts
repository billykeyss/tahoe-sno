import { serve } from '@hono/node-server';
import app from './app';

const port = Number(process.env.PORT ?? 8787);

serve({ fetch: app.fetch, port, hostname: process.env.HOST ?? "127.0.0.1" }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`TahoeSno data server listening on http://localhost:${info.port}`);
});
