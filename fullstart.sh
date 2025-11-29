#!/usr/bin/env bash
# Fullstart.sh - start infra compose stack and launch MagicMirror
# Place at /home/angel/dev/new/Jarvis/fullstart.sh
set -euo pipefail

printf "\n=== Fullstart.sh - Starting infra and MagicMirror ===\n\n"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$ROOT/infra"
MIRROR_DIR="$ROOT/mirror/MagicMirror"

info() { printf '\033[1;34m%s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m%s\033[0m\n' "$*"; }
err()  { printf '\033[1;31m%s\033[0m\n' "$*" >&2; }

# Find docker compose command (prefer `docker compose` over `docker-compose`)
find_compose_cmd() {
    if command -v docker >/dev/null 2>&1; then
        if docker compose version >/dev/null 2>&1; then
            echo "docker compose"
            return 0
        fi
    fi
    if command -v docker-compose >/dev/null 2>&1; then
        echo "docker-compose"
        return 0
    fi
    return 1
}

# Locate compose file under infra/ (check common locations including infra/docker/)
find_compose_file() {
    local candidates=(
        "$INFRA_DIR/docker-compose.yml"
        "$INFRA_DIR/docker-compose.yaml"
        "$INFRA_DIR/compose.yml"
        "$INFRA_DIR/compose.yaml"
        "$INFRA_DIR/docker/compose.yml"
        "$INFRA_DIR/docker/compose.yaml"
    )
    for f in "${candidates[@]}"; do
        if [ -f "$f" ]; then
            echo "$f"
            return 0
        fi
    done
    return 1
}

run_compose() {
    # $@ args appended to compose command
    local args=("$@")
    if [[ "$COMPOSE_CMD" == *" "* ]]; then
        # e.g. "docker compose" -> use eval
        eval "$COMPOSE_CMD -f \"$COMPOSE_FILE\" ${args[*]}"
    else
        "$COMPOSE_CMD" -f "$COMPOSE_FILE" "${args[@]}"
    fi
}

main() {
    info "Project root: $ROOT"

    # Locate compose file
    if ! COMPOSE_FILE="$(find_compose_file || true)" || [ -z "${COMPOSE_FILE:-}" ]; then
        warn "No Compose file found under $INFRA_DIR. Skipping Docker Compose startup."
    else
        info "Found compose file: $COMPOSE_FILE"

        # Determine compose client
        COMPOSE_CMD="$(find_compose_cmd || true)" || true
        if [ -z "${COMPOSE_CMD:-}" ]; then
            err "Docker Compose CLI not found. Install Docker with Compose (docker compose) or docker-compose."
            exit 1
        fi

        info "Using compose command: $COMPOSE_CMD"

        # Ensure docker daemon is reachable
        if ! command -v docker >/dev/null 2>&1; then
            err "Docker CLI not found in PATH. Install Docker."
            exit 1
        fi
        if ! docker info >/dev/null 2>&1; then
            warn "Docker daemon does not appear to be running or accessible. Try: sudo systemctl start docker"
        fi

        # Check if any containers for this compose project are running
        info "Checking compose stack status..."
        local ids
        if ids=$(eval "${COMPOSE_CMD} -f \"$COMPOSE_FILE\" ps -q" 2>/dev/null || true); then
            ids=$(echo "$ids" | tr -s '[:space:]' '\n' | sed '/^$/d' || true)
        else
            ids=""
        fi

        running=false
        if [ -n "$ids" ]; then
            for id in $ids; do
                if docker inspect -f '{{.State.Running}}' "$id" 2>/dev/null | grep -q true; then
                    running=true
                    break
                fi
            done
        fi

        if [ "$running" = true ]; then
            info "Compose stack already has running containers. Skipping 'up -d'."
        else
            info "Bringing up compose services (detached)..."
            local compose_dir
            compose_dir="$(cd "$(dirname "$COMPOSE_FILE")" && pwd)"
            (cd "$compose_dir" && run_compose up -d --remove-orphans)
            info "Compose 'up -d' completed."
        fi
    fi

    # Launch MagicMirror if not already running
    if [ ! -d "$MIRROR_DIR" ]; then
        warn "MagicMirror directory not found at $MIRROR_DIR. Skipping MagicMirror launch."
        exit 0
    fi

    # Check if MagicMirror is already running (look for main.js under mirror dir)
    if pgrep -f "${MIRROR_DIR}" >/dev/null 2>&1; then
        info "MagicMirror appears to be running. Skipping start."
        exit 0
    fi

    if ! command -v npm >/dev/null 2>&1; then
        err "npm not found in PATH. Install Node.js/npm to launch MagicMirror."
        exit 3
    fi

    info "Starting MagicMirror in $MIRROR_DIR"
    mkdir -p "$ROOT/logs"
    LOGFILE="$ROOT/logs/magicmirror-$(date +%Y%m%d-%H%M%S).log"
    nohup npm --prefix "$MIRROR_DIR" start >>"$LOGFILE" 2>&1 &
    sleep 1
    if pgrep -f "${MIRROR_DIR}" >/dev/null 2>&1; then
        info "MagicMirror started (logs: $LOGFILE)"
    else
        warn "MagicMirror did not appear to start. Check logs: $LOGFILE"
    fi
}

main "$@"