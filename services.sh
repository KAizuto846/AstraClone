#!/usr/bin/env bash
# Servicios del clon Astra — encender/apagar bajo demanda
# Uso: ~/AstraClone/services.sh [status|start|stop|searxng|vane]
set -e

SEARXNG_DIR="$HOME/AstraClone/research/searxng"

case "${1:-status}" in
  status)
    echo "== DeepTutor ==";  curl -s -o /dev/null -w "  app   :8443/chat -> %{http_code}\n" --max-time 10 https://riz0308.tail0820b4.ts.net:8443/chat 2>&1 || echo "  APAGADO"
    echo "== SearXNG ==";    curl -s -o /dev/null -w "  local :8888 -> %{http_code}\n" --max-time 8 "http://localhost:8888/search?q=t&format=json" 2>&1 || echo "  APAGADO"
    echo "== Vane (opcional) =="; curl -s -o /dev/null -w "  local :3001 -> %{http_code}\n" --max-time 8 http://localhost:3001 2>&1 || echo "  APAGADO"
    ;;
  searxng)
    cd "$SEARXNG_DIR"
    if curl -s -o /dev/null --max-time 5 "http://localhost:8888/search?q=t&format=json"; then
      echo "SearXNG ya corre en :8888"
    else
      nohup .venv/bin/python3 -m searx.webapp >"$HOME/AstraClone/logs/searxng.log" 2>&1 &
      sleep 6
      curl -s -o /dev/null -w "SearXNG :8888 -> %{http_code}\n" --max-time 10 "http://localhost:8888/search?q=t&format=json" || echo "falló arranque"
    fi
    ;;
  stop-vane)
    kill $(ss -tlnp 2>/dev/null | grep ":3001" | grep -oP 'pid=\K[0-9]+' | head -1) 2>/dev/null && echo "Vane detenido" || echo "Vane ya estaba apagado"
    ;;
  *)
    echo "Uso: ~/AstraClone/services.sh [status|searxng|stop-vane]"
    ;;
esac
