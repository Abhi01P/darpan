#!/bin/bash
set -euo pipefail

# ──────────────────────────────────────────────────────────
#  DrapeNet — Master Startup Script
#  Starts: Docker (MongoDB) → FastAPI → Vite Frontend
#  Usage:  ./start.sh          (start everything)
#          ./start.sh stop     (graceful shutdown)
# ──────────────────────────────────────────────────────────

# ── Resolve project root (where this script lives) ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDFILE_DIR="$SCRIPT_DIR/.pids"
LOG_DIR="$SCRIPT_DIR/logs"

# ── Colors ──
G='\033[0;32m'  # Green
B='\033[0;34m'  # Blue
Y='\033[1;33m'  # Yellow
R='\033[0;31m'  # Red
C='\033[0;36m'  # Cyan
NC='\033[0m'    # No Color

info()  { echo -e "${B}[DrapeNet]${NC} $1"; }
ok()    { echo -e "${G}  ✓${NC} $1"; }
warn()  { echo -e "${Y}  ⚠${NC} $1"; }
fail()  { echo -e "${R}  ✗${NC} $1"; }

# ── Shutdown handler ──
do_stop() {
    info "Shutting down DrapeNet services..."

    if [ -d "$PIDFILE_DIR" ]; then
        for pidfile in "$PIDFILE_DIR"/*.pid; do
            [ -f "$pidfile" ] || continue
            pid=$(cat "$pidfile")
            name=$(basename "$pidfile" .pid)
            if kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null && ok "Stopped $name (PID $pid)"
                # Give it a moment, then force-kill if still alive
                sleep 1
                kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null
            else
                warn "$name (PID $pid) was already dead"
            fi
            rm -f "$pidfile"
        done
    fi

    # Stop Docker containers (don't remove volumes)
    if [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
        docker compose -f "$SCRIPT_DIR/docker-compose.yml" stop 2>/dev/null && ok "Docker containers stopped"
    fi

    info "All services stopped."
    exit 0
}

# If called with "stop", just tear down and exit
if [ "${1:-}" = "stop" ]; then
    do_stop
fi

# ── Pre-flight checks ──
info "Running pre-flight checks..."

command -v docker >/dev/null 2>&1 || { fail "docker not found. Install Docker first."; exit 1; }
command -v uv >/dev/null 2>&1     || { fail "uv not found. Install uv (https://docs.astral.sh/uv/)."; exit 1; }
command -v node >/dev/null 2>&1   || { fail "node not found. Install Node.js 18+."; exit 1; }

ok "docker, uv, node found"

# ── Setup directories ──
mkdir -p "$PIDFILE_DIR" "$LOG_DIR" "$SCRIPT_DIR/uploads"

# ── Source .env if it exists ──
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
    ok "Loaded .env"
else
    warn "No .env file found — using defaults from config.py"
fi

# ── Clean up any leftover PIDs from a previous crash ──
if [ -d "$PIDFILE_DIR" ]; then
    for pidfile in "$PIDFILE_DIR"/*.pid; do
        [ -f "$pidfile" ] || continue
        pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            warn "Killing leftover process $(basename "$pidfile" .pid) (PID $pid)"
            kill "$pid" 2>/dev/null || true
            sleep 1
            kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$pidfile"
    done
fi

echo ""
echo -e "${C}╔══════════════════════════════════════════╗${NC}"
echo -e "${C}║       Starting DrapeNet Ecosystem        ║${NC}"
echo -e "${C}╚══════════════════════════════════════════╝${NC}"
echo ""

# ──────────────────────────────────────────
# Step 1: Docker (MongoDB)
# ──────────────────────────────────────────
info "${Y}[1/3]${NC} Starting Docker containers (MongoDB)..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d 2>&1 | tail -5

# Wait for MongoDB to accept connections (up to 15s)
MONGO_READY=false
for i in $(seq 1 15); do
    if docker compose -f "$SCRIPT_DIR/docker-compose.yml" exec -T mongodb mongosh --quiet --eval "db.runCommand({ping:1})" 2>/dev/null | grep -q "ok"; then
        MONGO_READY=true
        break
    fi
    sleep 1
done

if $MONGO_READY; then
    ok "MongoDB is responding"
else
    warn "MongoDB didn't respond in 15s — backend may fail to connect"
fi

# ──────────────────────────────────────────
# Step 2: FastAPI Backend
# ──────────────────────────────────────────
info "${Y}[2/3]${NC} Starting FastAPI Backend (port 8000)..."
cd "$SCRIPT_DIR"
PYTHONPATH="$SCRIPT_DIR" uv run uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --reload \
    --reload-dir "$SCRIPT_DIR/app" \
    > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$PIDFILE_DIR/backend.pid"
ok "Backend started (PID $(cat "$PIDFILE_DIR/backend.pid")) — logs: logs/backend.log"

# Give the backend a moment to bind
sleep 2

# ──────────────────────────────────────────
# Step 3: Vite Frontend
# ──────────────────────────────────────────
info "${Y}[3/3]${NC} Starting Vite Frontend (port 3000)..."

# Install deps if node_modules is missing
if [ ! -d "$SCRIPT_DIR/drapenet_react/node_modules" ]; then
    warn "node_modules not found — running npm install..."
    cd "$SCRIPT_DIR/drapenet_react" && npm install --silent 2>&1 | tail -3
fi

cd "$SCRIPT_DIR/drapenet_react"
npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$PIDFILE_DIR/frontend.pid"
cd "$SCRIPT_DIR"
ok "Frontend started (PID $(cat "$PIDFILE_DIR/frontend.pid")) — logs: logs/frontend.log"

# ──────────────────────────────────────────
# Done!
# ──────────────────────────────────────────
sleep 2
echo ""
echo -e "${C}╔══════════════════════════════════════════╗${NC}"
echo -e "${C}║      All DrapeNet services running!      ║${NC}"
echo -e "${C}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${G}Frontend UI${NC}   →  http://localhost:3000"
echo -e "  ${G}Backend API${NC}   →  http://localhost:8000/docs"
echo -e "  ${G}Health Check${NC}  →  http://localhost:8000/health"
echo ""
echo -e "  ${B}View logs:${NC}"
echo -e "    tail -f logs/backend.log"
echo -e "    tail -f logs/frontend.log"
echo -e "    tail -f logs/*.log          ${C}# all at once${NC}"
echo ""
echo -e "  ${R}Shut down:${NC}    ./start.sh stop"
echo ""
