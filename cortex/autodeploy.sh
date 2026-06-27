#!/usr/bin/env bash
set -euo pipefail
# autodeploy.sh — rebuild + restart TahoeSno when the committed code changes.
#
# Polled by launchd (com.tahoesno.autodeploy, StartInterval). Each tick:
#   1. fetch origin; fast-forward main IF the tree is clean and on main
#      (never clobbers local edits / diverged history)
#   2. if HEAD moved since the last successful deploy -> install, build, restart
#   3. health-check; only record the new SHA (forward-only) if it comes up green
# Triggers on either a local commit OR a commit pulled from GitHub.
# Note: it keys off the COMMITTED HEAD — uncommitted edits won't deploy until
# you commit them (prevents rebuilding mid-edit).

REPO="$HOME/projects/tahoe-sno"
LABEL="com.tahoesno.tmux"
PORT="${PORT:-8788}"
STATE="$REPO/cortex/.autodeploy_sha"
cd "$REPO"

log() { echo "[$(date '+%F %T')] $*"; }

git fetch --quiet origin 2>/dev/null || { log "fetch failed (offline?) — skipping"; exit 0; }

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
if [ -z "$(git status --porcelain)" ] && [ "$branch" = "main" ]; then
  git merge --ff-only --quiet origin/main 2>/dev/null || log "origin/main not fast-forwardable — leaving local HEAD"
fi

cur="$(git rev-parse HEAD)"
last="$(cat "$STATE" 2>/dev/null || true)"
[ "$cur" = "$last" ] && exit 0   # nothing new

log "deploying $cur (was ${last:-none})"
if ! pnpm install --frozen-lockfile >/tmp/tahoesno-autodeploy-install.log 2>&1; then
  log "pnpm install FAILED — see /tmp/tahoesno-autodeploy-install.log; not restarting"; exit 1
fi
if ! pnpm build >/tmp/tahoesno-autodeploy-build.log 2>&1; then
  log "BUILD FAILED — see /tmp/tahoesno-autodeploy-build.log; keeping previous build, not restarting"; exit 1
fi

launchctl kickstart -k "gui/$(id -u)/$LABEL"

for _ in $(seq 1 30); do
  if curl -fsS "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
    echo "$cur" > "$STATE"
    log "deployed $cur OK"
    exit 0
  fi
  sleep 1
done
log "HEALTH CHECK FAILED after deploying $cur — left running, NOT recording SHA (will retry next tick)"
exit 1
