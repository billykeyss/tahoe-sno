#!/bin/zsh
# tmux-serve.sh — launchd entrypoint (com.tahoesno.tmux).
# Hosts the TahoeSno server in an attachable tmux session.
# Session 'snow' on the default socket — attach with: tmux attach -t snow
# Crash recovery is handled by the respawn loop; launchd has no KeepAlive.

export PATH="$PATH:/opt/homebrew/bin"

REPO_DIR="${0:A:h}"
SESSION="snow"
PORT="${PORT:-8788}"

# Start Docker Desktop if installed and not already running
if [ -d "/Applications/Docker.app" ] && ! docker info >/dev/null 2>&1; then
  open -a Docker
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Docker Desktop..."
fi

tmux kill-session -t "$SESSION" 2>/dev/null || true

tmux new-session -d -s "$SESSION" -n server -c "$REPO_DIR" \
  "zsh -c 'while true; do PORT=$PORT NODE_ENV=production pnpm start; echo \"[$(date +%T)] server exited — restarting in 2s\"; sleep 2; done' 2>&1 | tee -a /tmp/tahoesno-server.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] snow session created (attach: tmux attach -t snow)"
