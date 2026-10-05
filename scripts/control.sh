#!/usr/bin/env bash
# ============================================================
#  Astra Clone — control de la app de tutoría IA self-hosted
#  (DeepTutor + Ollama + panel de modelos/API propio)
# ============================================================
set -euo pipefail

APP_DIR="$HOME/AstraClone/research/DeepTutor"
VENV="$APP_DIR/.venv/bin"
LOG="$APP_DIR/astra-clone.log"

case "${1:-}" in
  start)
    echo "▶ Iniciando AstraClone..."
    cd "$APP_DIR"
    export PATH="$VENV:$PATH"
    # Ollama (modelos locales, si no está corriendo)
    if ! curl -s --max-time 2 http://localhost:11434/api/tags >/dev/null 2>&1; then
      echo "  ↳ levantando Ollama..."
      nohup ollama serve >/tmp/ollama-serve.log 2>&1 &
      sleep 3
    fi
    # DeepTutor (backend + frontend)
    nohup "$VENV/deeptutor" start >"$LOG" 2>&1 &
    echo "  ↳ DeepTutor arrancando... (log: $LOG)"
    echo "  ↳ espera ~1-2 min (compila el frontend la 1ª vez)"
    echo "  ↳ App:  http://localhost:3782  (o http://localhost:3000)"
    echo "  ↳ Backend API: http://localhost:8001"
    ;;
  stop)
    echo "⏹ Deteniendo AstraClone..."
    cd "$APP_DIR"
    "$VENV/deeptutor" stop 2>/dev/null || true
    pkill -f "deeptutor start" 2>/dev/null || true
    pkill -f "next" 2>/dev/null || true
    pkill -f "uvicorn" 2>/dev/null || true
    echo "  ↳ detenido"
    ;;
  status)
    echo "=== Puertos ==="
    ss -tlnp 2>/dev/null | grep -E ':(3782|3000|8001|11434|20128)' || echo "  (nada escuchando)"
    echo "=== Ollama ==="
    curl -s --max-time 2 http://localhost:11434/api/tags | head -c 200 || echo "  no responde"
    echo
    echo "=== Log tail ==="
    tail -15 "$LOG" 2>/dev/null || echo "  (sin log)"
    ;;
  *)
    echo "Uso: $0 {start|stop|status}"
    exit 1
    ;;
esac
