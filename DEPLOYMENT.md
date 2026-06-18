# TahoeSno — Deployment Guide (Mac mini "cortex")

> Audience: an agent (or human) deploying on the **cortex Mac mini**. Follow top
> to bottom. Everything here has been verified locally; the only step not yet run
> on the mini itself is the launchd install (its runtime, `pnpm start`, is proven).

## What you're deploying

A single **Node (Hono) server** that:
1. Serves the static web UI (`build/client`), and
2. Proxies four **free, no-key** government data APIs server-side (so the browser
   never hits CORS): **Open-Meteo** (weather), **NWS** (alerts), **CDEC**
   (snowpack), **Caltrans** (road/chain status).

One process, one port (default **8787**). No database. No API keys.

## Prerequisites (install if missing)

| Need | Check | Install |
|---|---|---|
| Node ≥ 20 | `node -v` | `brew install node` |
| pnpm | `pnpm -v` | `corepack enable` |
| git | `git --version` | `xcode-select --install` |
| Tailscale | `tailscale version` | `brew install tailscale && sudo tailscale up` |

The repo must be **committed and pushed to git** from the dev machine first —
`setup.sh` deploys via `git pull` + `pnpm install --frozen-lockfile`, which needs
the committed `pnpm-lock.yaml`, `server/`, and `cortex/`.

## Quickstart

```bash
git clone git@github.com:billykeyss/tahoe-sno.git ~/srv/TahoeSno   # first time
cd ~/srv/TahoeSno
bash cortex/setup.sh           # installs deps, builds, installs launchd service, health-checks
tailscale serve --bg 8787      # expose privately to your tailnet
```

Override the port: `PORT=9000 bash cortex/setup.sh`.

## What `cortex/setup.sh` does (idempotent — safe to re-run)

1. Verifies Node + pnpm.
2. `pnpm install --frozen-lockfile` then `pnpm build` (produces `build/client`).
3. Installs a **launchd** agent `com.tahoesno.server` from
   `cortex/com.tahoesno.server.plist` → `~/Library/LaunchAgents/`, substituting the
   repo path + port. It runs `pnpm start`, **auto-starts at login, and restarts on
   crash/reboot** (`KeepAlive`).
4. Best-effort `sudo pmset -a sleep 0 disablesleep 1` to keep the mini awake.
5. Polls `http://localhost:8787/api/health` until green.

## Expose it

- **Private** (only your tailnet devices): `tailscale serve --bg 8787`
  → `https://cortex.<your-tailnet>.ts.net`
- **Public** (shareable): `tailscale funnel --bg 8787` (widens exposure — opt in deliberately).

## Verify

```bash
curl -s http://localhost:8787/api/health
curl -s "http://localhost:8787/api/weather?lat=39.1969&lon=-120.2357" | head -c 200
curl -s "http://localhost:8787/api/snowpack?resortId=heavenly"
curl -s "http://localhost:8787/api/alerts?lat=39.09&lon=-120.03"
curl -s http://localhost:8787/api/roads | head -c 200
```

Every endpoint returns `{ data, source, fetchedAt }` (snowpack also `stationId`).
`source` is the provenance string shown in the UI.

## Operate

| Action | Command |
|---|---|
| Logs (stderr) | `tail -f cortex/tahoesno.err.log` |
| Restart | `launchctl kickstart -k gui/$(id -u)/com.tahoesno.server` |
| Stop | `launchctl unload ~/Library/LaunchAgents/com.tahoesno.server.plist` |
| Redeploy after a push | `bash cortex/redeploy.sh` (pull → build → restart) |
| Local smoke test (no launchd) | `./dev-start.sh prod` then open `http://localhost:8787` |

## Endpoints

| Method | Path | Source | Notes |
|---|---|---|---|
| GET | `/api/health` | — | liveness |
| GET | `/api/weather?lat=&lon=` | Open-Meteo | temp, wind, 5-day forecast, 7-day history, snow depth |
| GET | `/api/alerts?lat=&lon=` | NWS | active weather alerts (`data: []` when none) |
| GET | `/api/snowpack?resortId=` | CDEC | measured depth + SWE; `{ "data": null }` if the resort has no mapped station |
| GET | `/api/roads` | Caltrans | chain control + closures for I-80 / US-50 / SR-89 |

Responses are cached in-memory (weather 15 min, alerts 5 min, snowpack 90 min,
roads 5 min) to protect the upstream gov APIs.

## Architecture notes

- The app is a **static SPA** (`ssr: false`); the Hono server serves it and the
  `/api` proxy from one origin (no cross-origin CORS). Not SSR.
- **CDEC** rejects Node's global `fetch` (ECONNRESET) — the server uses a
  `node:https` transport for it (`server/lib/http.ts`). Do **not** change it back.
- Runtime is `tsx server/index.ts` (TypeScript run directly; no compile step).

## Troubleshooting

| Symptom | Fix |
|---|---|
| `setup.sh`: "pnpm not found" | `corepack enable` (or `npm i -g pnpm`) |
| `--frozen-lockfile` errors | The committed `pnpm-lock.yaml` is stale — re-push from dev, or run `pnpm install` once |
| Port 8787 in use | `lsof -ti tcp:8787 \| xargs kill`, or set `PORT=` |
| Server up but unreachable remotely | `tailscale status`; ensure `tailscale serve --bg 8787` is active |
| macOS "accept incoming connections?" prompt | Allow it (first launch only); on a headless mini, pre-allow in System Settings → Network |
| launchd service not starting | `tail cortex/tahoesno.err.log`; confirm `pnpm` is on the login PATH (the plist uses `bash -lc`) |
| `/api/snowpack` returns `{"data":null}` | Expected — that resort has no nearby CDEC station (SoCal, sparse NV side) |
| Snowpack/weather show 0 | Expected off-season; data is live but there's no snow |

## Data provenance (what's from where)

| Shown in UI | Source | Endpoint |
|---|---|---|
| Temp, conditions, fresh snow, 5-day forecast, base/summit depth, 7-day histogram | **Open-Meteo** | `/api/weather` |
| Card footer "BASE · CDEC" + SWE (measured at a named station) | **CDEC** | `/api/snowpack` |
| "Mountain Passes" panel + hero "Chains I-80" | **Caltrans** | `/api/roads` |
| Alert banner + hero "NWS alerts" count | **NWS** | `/api/alerts` |

Every API response carries its own `source` and `fetchedAt`, so provenance is
inspectable per request, not just in the UI.
