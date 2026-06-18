# Deploying TahoeSno on cortex (Mac mini) — agent runbook

**The canonical, full guide is [`../DEPLOYMENT.md`](../DEPLOYMENT.md).** Read it.

## TL;DR

```bash
bash cortex/setup.sh            # install deps, build, install launchd service, health-check
tailscale serve --bg 8787       # expose privately to your tailnet (or `funnel` for public)
```

- Prereqs: Node ≥ 20, pnpm (`corepack enable`), git, Tailscale. Repo must be pushed to git first.
- Verify: `curl -s http://localhost:8787/api/health`
- Logs: `tail -f cortex/tahoesno.err.log` · Restart: `launchctl kickstart -k gui/$(id -u)/com.tahoesno.server`
- Redeploy after a push: `bash cortex/redeploy.sh`

See `../DEPLOYMENT.md` for endpoints, exposure options, troubleshooting, and data provenance.
