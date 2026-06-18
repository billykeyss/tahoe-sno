#!/usr/bin/env bash
set -euo pipefail
# Pull latest, rebuild, and restart the launchd-managed server.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PORT="${PORT:-8787}"
LABEL="com.tahoesno.server"
cd "$REPO_DIR"

echo "==> Pulling latest"
git pull --ff-only

echo "==> Installing + building"
pnpm install --frozen-lockfile
pnpm build

echo "==> Restarting $LABEL"
launchctl kickstart -k "gui/$(id -u)/$LABEL"

echo "==> Waiting for health..."
for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
    echo "==> Healthy"
    exit 0
  fi
  sleep 1
done
echo "!! Health check did not pass — see cortex/tahoesno.err.log" >&2
exit 1
