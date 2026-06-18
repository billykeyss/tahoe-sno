#!/usr/bin/env bash
set -euo pipefail
# TahoeSno — self-host bring-up for the cortex Mac mini. Idempotent: safe to re-run.
# Usage:  bash cortex/setup.sh        (PORT defaults to 8787)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-8787}"
LABEL="com.tahoesno.server"
PLIST_DST="$HOME/Library/LaunchAgents/$LABEL.plist"
cd "$REPO_DIR"

echo "==> TahoeSno self-host setup (repo: $REPO_DIR, port: $PORT)"

# 1) Node >= 20
if ! command -v node >/dev/null 2>&1; then
  echo "!! Node not found. Install Node >= 20 ('brew install node') and re-run." >&2
  exit 1
fi
echo "==> Node $(node -v)"

# 2) pnpm (via corepack)
corepack enable >/dev/null 2>&1 || true
if ! command -v pnpm >/dev/null 2>&1; then
  echo "!! pnpm not found. Run 'corepack enable' or 'npm i -g pnpm' and re-run." >&2
  exit 1
fi
echo "==> pnpm $(pnpm -v)"

# 3) Install + build
echo "==> Installing dependencies"
pnpm install --frozen-lockfile
echo "==> Building client (build/client)"
pnpm build

# 4) launchd service (auto-start, restart on crash/reboot)
echo "==> Installing launchd service -> $PLIST_DST"
mkdir -p "$HOME/Library/LaunchAgents"
sed -e "s|__REPO_DIR__|$REPO_DIR|g" -e "s|__PORT__|$PORT|g" \
  "$SCRIPT_DIR/$LABEL.plist" >"$PLIST_DST"
launchctl unload "$PLIST_DST" 2>/dev/null || true
launchctl load "$PLIST_DST"

# 5) Keep the mini awake (best-effort; needs sudo)
if sudo -n true 2>/dev/null; then
  sudo pmset -a sleep 0 disablesleep 1 || true
  echo "==> Sleep disabled (always-on)"
else
  echo "==> NOTE: run 'sudo pmset -a sleep 0 disablesleep 1' to keep the mini always-on"
fi

# 6) Health check
echo "==> Waiting for health..."
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
    echo "==> Healthy: http://localhost:$PORT/api/health"
    break
  fi
  sleep 1
done

cat <<EOF

✅ Done. Server is managed by launchd ($LABEL) and restarts on crash/reboot.

Expose it (pick one):
  Private (your devices only):  tailscale serve --bg $PORT
  Public (shareable URL):       tailscale funnel --bg $PORT

Logs:     tail -f $REPO_DIR/cortex/tahoesno.err.log
Restart:  launchctl kickstart -k gui/\$(id -u)/$LABEL
Redeploy: bash $SCRIPT_DIR/redeploy.sh
EOF
