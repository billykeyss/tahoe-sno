#!/usr/bin/env bash
set -euo pipefail
# dev-start.sh — launch the TahoeSno stack in a tmux session for local testing.
#
#   ./dev-start.sh            DEV mode: Vite web (1255) + API server (8787, hot reload)
#   ./dev-start.sh prod       DEPLOY TEST: build, then run the single prod server
#                             (serves build/client + /api on 8787) — exactly what
#                             cortex/setup.sh runs on the Mac mini, minus launchd.
#
# Attach:  tmux attach -t tahoesno     Detach: Ctrl-b then d
# Stop:    ./dev-start.sh stop   (or  tmux kill-session -t tahoesno)

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="tahoesno"
MODE="${1:-dev}"
API_PORT="${API_PORT:-8787}"
WEB_PORT="${WEB_PORT:-1255}"
cd "$REPO_DIR"

command -v tmux >/dev/null || { echo "!! tmux not installed (brew install tmux)" >&2; exit 1; }

if [ "$MODE" = "stop" ]; then
  tmux kill-session -t "$SESSION" 2>/dev/null && echo "Stopped '$SESSION'." || echo "No '$SESSION' session."
  # also free the api port in case a stray server is bound
  lsof -ti tcp:"$API_PORT" 2>/dev/null | xargs kill 2>/dev/null || true
  exit 0
fi

# Fresh session + free the port.
tmux kill-session -t "$SESSION" 2>/dev/null || true
lsof -ti tcp:"$API_PORT" 2>/dev/null | xargs kill 2>/dev/null || true

if [ "$MODE" = "prod" ] || [ "$MODE" = "deploy" ]; then
  echo "==> Deploy test: building client (pnpm build)…"
  pnpm build
  tmux new-session -d -s "$SESSION" -n stack -c "$REPO_DIR"
  server_pane="$(tmux list-panes -t "$SESSION" -F '#{pane_id}' | head -1)"
  tmux send-keys -t "$server_pane" "PORT=$API_PORT NODE_ENV=production pnpm start" C-m
  APP_URL="http://localhost:$API_PORT"
  echo "==> Mode: PROD (single server serving SPA + /api on $API_PORT)"
else
  tmux new-session -d -s "$SESSION" -n stack -c "$REPO_DIR"
  server_pane="$(tmux list-panes -t "$SESSION" -F '#{pane_id}' | head -1)"
  tmux send-keys -t "$server_pane" "PORT=$API_PORT pnpm server" C-m
  web_pane="$(tmux split-window -h -P -F '#{pane_id}' -t "$server_pane" -c "$REPO_DIR")"
  tmux send-keys -t "$web_pane" "pnpm dev:web" C-m
  APP_URL="http://localhost:$WEB_PORT"
  echo "==> Mode: DEV (Vite web on $WEB_PORT + hot-reload API on $API_PORT)"
fi

# A small pane that waits for health and prints the endpoints.
health_pane="$(tmux split-window -v -P -F '#{pane_id}' -t "$server_pane" -c "$REPO_DIR")"
tmux send-keys -t "$health_pane" \
  "echo 'waiting for API…'; until curl -fsS http://localhost:$API_PORT/api/health >/dev/null 2>&1; do sleep 1; done; echo; echo 'API healthy:'; curl -s http://localhost:$API_PORT/api/health; echo; echo; echo 'App:  $APP_URL'; echo 'Try:  curl -s \"http://localhost:$API_PORT/api/roads\" | head -c 200'" C-m
tmux select-layout -t "$SESSION" tiled >/dev/null

# Block until healthy so the caller gets a clear success/failure signal.
echo -n "==> Waiting for http://localhost:$API_PORT/api/health "
for _ in $(seq 1 40); do
  if curl -fsS "http://localhost:$API_PORT/api/health" >/dev/null 2>&1; then
    echo "OK"
    echo
    echo "✅ TahoeSno [$MODE] running in tmux session '$SESSION'."
    echo "   App:    $APP_URL"
    echo "   Attach: tmux attach -t $SESSION"
    echo "   Stop:   ./dev-start.sh stop"
    exit 0
  fi
  echo -n "."
  sleep 1
done
echo " TIMEOUT"
echo "!! API did not become healthy. Attach to inspect: tmux attach -t $SESSION" >&2
exit 1
