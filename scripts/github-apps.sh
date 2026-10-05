#!/usr/bin/env bash
# Lanzador de apps clonadas de GitHub la semana pasada (AstraClone/research)
# Uso: github-apps.sh [menu|run <id>|status]   (sin argumentos = menu zenity)
set -uo pipefail

ASTRA=/home/rizutov/AstraClone
LOG="$ASTRA/logs"
WAIT_URL() { # wait_url <url> <segundos>
  local url="$1" t="$2" i=0
  while [ "$i" -lt "$t" ]; do
    if curl -s -o /dev/null --max-time 3 "$url"; then echo "listo"; return 0; fi
    i=$((i+3)); sleep 3
  done
  echo "no-responde"; return 1
}

run_astra() { # DeepTutor: frontend :3782, backend :8001
  if curl -s -o /dev/null --max-time 3 http://localhost:3782; then
    zenity --info --text="Astra Tutor ya está corriendo. Abriendo el navegador…" 2>/dev/null || true
  else
    "$ASTRA/scripts/control.sh" start
    zenity --info --text="Astra Tutor arrancando…\nLa primera compilación tarda 1-3 min.\nSe abrirá el navegador cuando esté listo." 2>/dev/null || true
  fi
  r=$(WAIT_URL http://localhost:3782 240)
  if [ "$r" = "listo" ]; then xdg-open http://localhost:3782; else
    zenity --error --text="Astra Tutor no respondió en :3782.\nRevisa $ASTRA/research/DeepTutor/astra-clone.log" 2>/dev/null || true
  fi
}

run_searxng() { # buscador local :8888
  "$ASTRA/services.sh" searxng
  r=$(WAIT_URL "http://localhost:8888/search?q=t&format=json" 40)
  if [ "$r" = "listo" ]; then xdg-open http://localhost:8888; else
    zenity --error --text="SearXNG no respondió en :8888.\nLog: $LOG/searxng.log" 2>/dev/null || true
  fi
}

run_vane() { # Vane (opcional, build ya hecho), puerto :3001
  if curl -s -o /dev/null --max-time 3 http://localhost:3001; then
    xdg-open http://localhost:3001; return 0
  fi
  cd "$ASTRA/research/vane" || return 1
  nohup npx next start -p 3001 >"$LOG/vane.log" 2>&1 &
  r=$(WAIT_URL http://localhost:3001 90)
  if [ "$r" = "listo" ]; then xdg-open http://localhost:3001; else
    zenity --error --text="Vane no respondió en :3001.\nLog: $LOG/vane.log" 2>/dev/null || true
  fi
}

status_all() {
  { echo "== Estado de servicios =="
    echo -n "Astra Tutor  :3782 -> "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 http://localhost:3782 || echo "apagado"
    echo -n "SearXNG      :8888 -> "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 "http://localhost:8888/search?q=t&format=json" || echo "apagado"
    echo -n "Vane         :3001 -> "; curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 http://localhost:3001 || echo "apagado"
  } | zenity --info --title="Apps GitHub (semana)" --text="$(cat)" 2>/dev/null || true
}

case "${1:-menu}" in
  run)
    case "${2:-}" in astra) run_astra;; searxng) run_searxng;; vane) run_vane;;
      *) echo "id valido: astra | searxng | vane"; exit 1;; esac ;;
  status) status_all ;;
  menu|*)
    [ -n "${DISPLAY:-}" ] || { echo "sin DISPLAY"; exit 1; }
    sel=$(zenity --list --title="Apps GitHub (semana)" --text="¿Qué aplicación abro?" \
      --radiolist --column="" --column="Aplicación" \
      FALSE "Astra Tutor (DeepTutor) — :3782" \
      FALSE "SearXNG — buscador privado — :8888" \
      FALSE "Vane — motor de respuestas (opcional) — :3001" \
      FALSE "Explorar ~/AstraClone/research" \
      FALSE "Estado de servicios" 2>/dev/null) || exit 0
    case "$sel" in
      *Astra*)  run_astra ;;
      *SearXNG*) run_searxng ;;
      *Vane*)   run_vane ;;
      *Explorar*) thunar "$ASTRA/research" & ;;
      *Estado*) status_all ;;
      *) exit 0 ;;
    esac ;;
esac