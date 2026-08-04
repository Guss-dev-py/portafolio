#!/usr/bin/env bash
# Levanta el portfolio completo con un solo comando:
#
#   ./deploy.sh
#
# Es idempotente: sirve tanto para la primera instalación en un servidor limpio
# como para actualizar un stack que ya está corriendo (`git pull && ./deploy.sh`).
#
# Qué hace:
#   1. Verifica que estén Docker y el plugin `compose`, y que los puertos estén libres.
#   2. Si no hay .env, lo crea: genera los secretos solos y pregunta lo que no
#      se puede adivinar (usuario admin, password, API key de Resend, dominio).
#      El hash bcrypt lo calcula adentro del contenedor — no hace falta Node en el host.
#   3. Construye las imágenes y levanta los servicios.
#   4. Espera el health check real (la API contra la base, vía nginx) y reporta.
#
# Todos los servicios corren sin root. Ver docker-compose.yml.
#
# Variables útiles:
#   ENV_FILE=.env.prod ./deploy.sh    usar otro archivo de entorno
#   SKIP_BUILD=1 ./deploy.sh          no reconstruir las imágenes
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"
EXAMPLE_FILE=".env.example"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
# Valor que se escribe cuando se omite el email. El backend exige que la
# variable EXISTA (valida el entorno al arrancar y se cae si falta), así que no
# puede quedar vacía; este placeholder satisface la validación y falla solo al
# intentar enviar, que es justo lo que contact.ts ya tolera.
SKIP_EMAIL="re_sin_configurar"

# ── Salida ────────────────────────────────────────────────────────
if [ -t 1 ]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; RESET=''
fi
step() { printf '\n%s▸ %s%s\n' "$BOLD" "$1" "$RESET"; }
# `docker compose` solo auto-carga `.env`. Sin --env-file, un ENV_FILE=.env.prod
# se escribiría bien y compose lo ignoraría, levantando el stack con variables
# vacías. Se pasa solo si el archivo ya existe: en la primera corrida todavía no.
dc() {
  if [ -f "$ENV_FILE" ]; then
    docker compose --env-file "$ENV_FILE" "$@"
  else
    docker compose "$@"
  fi
}
ok()   { printf '  %s✓%s %s\n' "$GREEN" "$RESET" "$1"; }
warn() { printf '  %s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()  { printf '\n%s✗ %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

# ── 1. Preflight ──────────────────────────────────────────────────
step "Verificando requisitos"

[ -f docker-compose.yml ] || die "Correr desde la raíz del repo (no encuentro docker-compose.yml)."
command -v docker >/dev/null 2>&1 || die "Docker no está instalado. https://docs.docker.com/engine/install/"
docker compose version >/dev/null 2>&1 || die "Falta el plugin 'docker compose' (v2). Instalar docker-compose-plugin."

if ! docker info >/dev/null 2>&1; then
  die "El daemon de Docker no responde. Probá: sudo systemctl start docker
  Si es por permisos, agregate al grupo docker: sudo usermod -aG docker \$USER (y volvé a entrar)."
fi
ok "Docker $(docker version --format '{{.Server.Version}}' 2>/dev/null) + compose $(docker compose version --short 2>/dev/null)"

# Si el stack ya está corriendo, los puertos están ocupados por nosotros mismos
# y eso no es un conflicto: el chequeo se saltea en un redeploy.
STACK_RUNNING=$(dc ps -q 2>/dev/null | wc -l)

port_busy() {
  command -v ss >/dev/null 2>&1 || return 1
  ss -tln 2>/dev/null | grep -qE "[:.]$1[[:space:]]"
}

# Se llama DESPUÉS de resolver el entorno, no antes: en una instalación limpia
# todavía no hay .env que leer, y es justo el caso donde un choque de puertos
# es más probable y más confuso de diagnosticar (docker falla con un "address
# already in use" que no dice qué variable cambiar).
check_ports() {
  [ "$STACK_RUNNING" -eq 0 ] || return 0
  local var val
  for var in FRONTEND_PORT BACKEND_PORT POSTGRES_PORT; do
    val=$(grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
    [ -n "$val" ] || continue
    if port_busy "$val"; then
      die "El puerto $val ($var) ya está ocupado por otro proceso.
  Verlo con: ss -tlnp | grep $val
  Después cambiá $var en $ENV_FILE y volvé a correr ./deploy.sh"
    fi
  done
  ok "Puertos libres"
}

# ── 2. Entorno ────────────────────────────────────────────────────
# Escapa los $ para Docker Compose, que interpola $VAR en los valores del .env.
# Crítico para el hash bcrypt ($2b$12$...), inofensivo para el resto.
esc() { printf '%s' "${1//\$/\$\$}"; }

set_var() {
  local key="$1" value; value=$(esc "$2")
  if grep -q "^${key}=" "$ENV_FILE"; then
    # | como delimitador: los hashes bcrypt y las URLs llevan /
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

ask() {
  local prompt="$1" default="${2:-}" answer
  if [ -n "$default" ]; then
    read -r -p "  $prompt [$default]: " answer
    printf '%s' "${answer:-$default}"
  else
    while :; do
      read -r -p "  $prompt: " answer
      [ -n "$answer" ] && { printf '%s' "$answer"; return; }
      printf '    (no puede quedar vacío)\n' >&2
    done
  fi
}

if [ -f "$ENV_FILE" ]; then
  step "Entorno"
  ok "$ENV_FILE ya existe — se respeta tal cual"
else
  step "Creando $ENV_FILE (primera instalación)"
  [ -f "$EXAMPLE_FILE" ] || die "No encuentro $EXAMPLE_FILE para usar de plantilla."
  [ -t 0 ] || die "No hay $ENV_FILE y la entrada no es interactiva.
  Copiá $EXAMPLE_FILE a $ENV_FILE, completalo, y volvé a correr ./deploy.sh"

  cp "$EXAMPLE_FILE" "$ENV_FILE"
  chmod 600 "$ENV_FILE"

  printf '  %sLo que se puede generar solo, se genera solo. Te pregunto el resto.%s\n\n' "$DIM" "$RESET"

  # Los puertos se pueden fijar de antemano por variable de entorno, para poder
  # scriptear una instalación con puertos no default:
  #   BACKEND_PORT=13001 POSTGRES_PORT=15432 ./deploy.sh
  FRONTEND_PORT=$(ask "Puerto del portfolio" "${FRONTEND_PORT:-8080}")
  ADMIN_USERNAME=$(ask "Usuario del panel admin" "${ADMIN_USERNAME:-admin}")

  while :; do
    read -r -s -p "  Password del admin: " ADMIN_PW; echo
    [ ${#ADMIN_PW} -ge 8 ] || { printf '    (mínimo 8 caracteres)\n'; continue; }
    read -r -s -p "  Repetir password: " ADMIN_PW2; echo
    [ "$ADMIN_PW" = "$ADMIN_PW2" ] && break
    printf '    (no coinciden)\n'
  done

  CORS_ORIGIN=$(ask "Dominio público, sin barra final" "http://localhost:${FRONTEND_PORT}")

  # El email es OPCIONAL a propósito. Quien despliega esto para probarlo no
  # tiene por qué tener una cuenta de Resend, y exigirla convertía un deploy de
  # un comando en "andá a registrarte a otro servicio primero".
  #
  # Degrada bien: contact.ts hace el INSERT y el envío en paralelo y el envío
  # tiene su propio .catch — con una key inválida el formulario sigue
  # respondiendo 201, el mensaje queda guardado y se ve en /admin/mensajes.
  # Lo único que no pasa es la notificación por mail.
  printf '\n  %sNotificación por email de los mensajes de contacto (opcional).%s\n' "$DIM" "$RESET"
  printf '  %sSin esto el formulario igual funciona y los mensajes se leen en el panel admin.%s\n' "$DIM" "$RESET"
  RESEND_API_KEY=$(ask "API key de Resend — resend.com/api-keys, Enter para omitir" "$SKIP_EMAIL")
  if [ "$RESEND_API_KEY" = "$SKIP_EMAIL" ]; then
    RECIPIENT_EMAIL="sin-configurar@localhost"
    EMAIL_DISABLED=1
  else
    RECIPIENT_EMAIL=$(ask "Email donde llegan los mensajes")
  fi

  # Secretos: hex, no base64. base64 mete / y + que romperían el DATABASE_URL.
  POSTGRES_PASSWORD=$(openssl rand -hex 24)
  JWT_SECRET=$(openssl rand -hex 32)

  set_var FRONTEND_PORT     "$FRONTEND_PORT"
  set_var BACKEND_PORT      "${BACKEND_PORT:-3001}"
  set_var POSTGRES_PORT     "${POSTGRES_PORT:-5432}"
  set_var POSTGRES_PASSWORD "$POSTGRES_PASSWORD"
  set_var DATABASE_URL      "postgresql://portfolio_user:${POSTGRES_PASSWORD}@postgres:5432/portfolio"
  set_var JWT_SECRET        "$JWT_SECRET"
  set_var ADMIN_USERNAME    "$ADMIN_USERNAME"
  set_var CORS_ORIGIN       "$CORS_ORIGIN"
  set_var RECIPIENT_EMAIL   "$RECIPIENT_EMAIL"
  set_var RESEND_API_KEY    "$RESEND_API_KEY"
  # Placeholder: el hash real se calcula abajo, ya con la imagen construida.
  set_var ADMIN_PASSWORD_HASH "pendiente"

  ok "Secretos generados (POSTGRES_PASSWORD, JWT_SECRET) y $ENV_FILE escrito con permisos 600"
  NEEDS_HASH=1
fi

check_ports

# ── 3. Build ──────────────────────────────────────────────────────
if [ "${SKIP_BUILD:-0}" = "1" ]; then
  step "Build salteado (SKIP_BUILD=1)"
else
  step "Construyendo imágenes"
  dc build
  ok "Imágenes listas"
fi

# El hash bcrypt se calcula DENTRO del contenedor: bcrypt ya está en las
# dependencias de producción del backend, así que el host no necesita Node.
# La password va por variable de entorno y no por argv, para que no quede
# visible en la lista de procesos del host.
if [ "${NEEDS_HASH:-0}" = "1" ]; then
  step "Calculando el hash del password del admin"
  HASH=$(dc run --rm --no-deps -T -e ADMIN_PW="$ADMIN_PW" backend \
    node -e "require('bcrypt').hash(process.env.ADMIN_PW,12).then(h=>process.stdout.write(h))" 2>/dev/null | tr -d '\r\n')
  case "$HASH" in
    \$2*) ;;
    *) die "No se pudo generar el hash bcrypt. Ver: docker compose run --rm --no-deps backend node -e \"require('bcrypt')\"" ;;
  esac
  set_var ADMIN_PASSWORD_HASH "$HASH"
  unset ADMIN_PW ADMIN_PW2
  ok "ADMIN_PASSWORD_HASH escrito (bcrypt, 12 rondas)"
fi

# ── 4. Levantar ───────────────────────────────────────────────────
step "Levantando los servicios"
dc up -d --remove-orphans
ok "Contenedores arriba"

# ── 5. Verificar ──────────────────────────────────────────────────
# El health real: la API responde Y llega a la base, atravesando nginx. Es el
# mismo camino que usa el navegador, así que descarta también un proxy roto.
step "Esperando que el stack responda"

FRONTEND_PORT=$(grep -E '^FRONTEND_PORT=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
FRONTEND_PORT="${FRONTEND_PORT:-8080}"
URL="http://127.0.0.1:${FRONTEND_PORT}"

deadline=$(( SECONDS + HEALTH_TIMEOUT ))
until curl -sf "${URL}/api/health" 2>/dev/null | grep -q '"db":"ok"'; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    printf '\n'
    warn "Sin respuesta después de ${HEALTH_TIMEOUT}s. Últimas líneas del backend:"
    dc logs --tail 30 backend
    die "El stack no llegó a estado sano. Diagnóstico: docker compose ps && docker compose logs"
  fi
  sleep 2
done

# Que el sitio público sirva HTML, no solo que la API esté viva.
curl -sf "$URL" >/dev/null 2>&1 || die "La API responde pero el sitio no. Ver: docker compose logs frontend"

ok "API conectada a la base y sitio sirviendo"

# ── 6. Resumen ────────────────────────────────────────────────────
step "Listo"
printf '  Portfolio : %s%s%s\n' "$BOLD" "$URL" "$RESET"
printf '  Admin     : %s%s/admin/login%s\n' "$BOLD" "$URL" "$RESET"
ADMIN_USER=$(grep -E '^ADMIN_USERNAME=' "$ENV_FILE" | cut -d= -f2- | tr -d '"')
printf '  Usuario   : %s%s%s %s(la password es la que pusiste recién)%s\n' \
  "$BOLD" "$ADMIN_USER" "$RESET" "$DIM" "$RESET"

if [ "${EMAIL_DISABLED:-0}" = "1" ]; then
  printf '\n'
  warn "Sin email configurado: el formulario de contacto guarda los mensajes y se
    leen en $URL/admin/mensajes, pero no llega notificación por mail.
    Para activarlo: poné una RESEND_API_KEY real en $ENV_FILE y corré ./deploy.sh de nuevo."
fi
printf '\n  %sUsuarios de los contenedores:%s\n' "$DIM" "$RESET"
dc top 2>/dev/null | awk '
  /^[a-z-]+ / && NF > 3 { svc=$1; uid=$3; if (!(svc in seen)) { seen[svc]=uid; printf "    %-12s %s\n", svc, uid } }
'
printf '\n  %sLogs: docker compose logs -f   ·   Parar: docker compose down%s\n\n' "$DIM" "$RESET"
