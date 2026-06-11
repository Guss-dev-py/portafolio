#!/usr/bin/env bash
# Rotación de secretos del stack Docker del portfolio.
#
# Uso: correr desde la raíz del repo (donde están .env y docker-compose.yml):
#   ./infra/rotate-secrets.sh
#
# Qué hace:
#   1. Rota JWT_SECRET (siempre — invalida las sesiones admin activas).
#   2. Opcional: rota el password de Postgres (ALTER USER + .env).
#   3. Opcional: rota el password del admin (pide uno nuevo, lo hashea con
#      bcrypt dentro del contenedor backend y lo escapa para Compose).
#   4. Opcional: actualiza la API key de Resend (crearla antes en
#      https://resend.com/api-keys y revocar la vieja).
#   5. Recrea el backend con el nuevo entorno y verifica el health check.
#
# Los valores nuevos se generan acá y solo viven en el .env del servidor.
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

if [ ! -f "$ENV_FILE" ] || [ ! -f docker-compose.yml ]; then
  echo "Error: correr desde la raíz del repo (no encuentro $ENV_FILE o docker-compose.yml)" >&2
  exit 1
fi

backup="${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$ENV_FILE" "$backup"
chmod 600 "$backup"
echo "Backup del .env: $backup"

# Reemplaza (o agrega) una variable en el .env. Usa | como delimitador de sed
# porque los hashes bcrypt contienen /.
set_var() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
  fi
}

ask() {
  local prompt="$1" yn
  read -r -p "$prompt [y/N] " yn
  [[ "${yn,,}" == "y" ]]
}

# ── 1. JWT_SECRET ────────────────────────────────────────────────
NEW_JWT=$(openssl rand -hex 32)
set_var JWT_SECRET "$NEW_JWT"
echo "✓ JWT_SECRET rotado (las sesiones admin activas quedan invalidadas)"

# ── 2. Password de Postgres ──────────────────────────────────────
if ask "¿Rotar el password de Postgres?"; then
  NEW_PG=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 24)
  PG_CONTAINER=$(docker compose ps -q postgres)
  if [ -z "$PG_CONTAINER" ]; then
    echo "Error: el contenedor de postgres no está corriendo" >&2
    exit 1
  fi
  docker exec "$PG_CONTAINER" psql -U portfolio_user -d portfolio \
    -c "ALTER USER portfolio_user WITH PASSWORD '${NEW_PG}';" > /dev/null
  set_var POSTGRES_PASSWORD "$NEW_PG"
  set_var DATABASE_URL "postgresql://portfolio_user:${NEW_PG}@postgres:5432/portfolio"
  echo "✓ Password de Postgres rotado en la base y en el .env"
fi

# ── 3. Password del admin ────────────────────────────────────────
if ask "¿Rotar el password del panel admin?"; then
  read -r -s -p "Nuevo password del admin: " NEW_ADMIN
  echo
  read -r -s -p "Repetir password: " NEW_ADMIN2
  echo
  if [ "$NEW_ADMIN" != "$NEW_ADMIN2" ]; then
    echo "Error: no coinciden" >&2
    exit 1
  fi
  HASH=$(docker compose exec -T backend node -e \
    "require('bcrypt').hash(process.argv[1], 12).then(h => console.log(h))" "$NEW_ADMIN")
  # Compose interpola $ — en el .env cada $ del hash va escapado como $$
  HASH_ESCAPED="${HASH//\$/\$\$}"
  set_var ADMIN_PASSWORD_HASH "$HASH_ESCAPED"
  echo "✓ ADMIN_PASSWORD_HASH rotado"
fi

# ── 4. API key de Resend ─────────────────────────────────────────
if ask "¿Actualizar la API key de Resend? (crear la nueva antes en resend.com/api-keys)"; then
  read -r -s -p "Nueva RESEND_API_KEY: " NEW_RESEND
  echo
  set_var RESEND_API_KEY "$NEW_RESEND"
  echo "✓ RESEND_API_KEY actualizada (acordate de revocar la vieja en el dashboard)"
fi

# ── 5. Aplicar y verificar ───────────────────────────────────────
echo "Recreando el backend con el nuevo entorno..."
docker compose up -d backend > /dev/null 2>&1
# nginx resuelve el DNS del backend al arrancar: tras recrear el backend
# cambia la IP interna y el proxy devuelve 502 hasta reiniciar el frontend.
docker compose restart frontend > /dev/null 2>&1

BACKEND_PORT=$(grep "^BACKEND_PORT=" "$ENV_FILE" | cut -d= -f2)
BACKEND_PORT="${BACKEND_PORT:-3001}"

FRONTEND_PORT=$(grep "^FRONTEND_PORT=" "$ENV_FILE" | cut -d= -f2)
FRONTEND_PORT="${FRONTEND_PORT:-8080}"

for i in $(seq 1 15); do
  sleep 2
  if curl -sf "http://localhost:${BACKEND_PORT}/api/health" | grep -q '"db":"ok"' \
     && curl -sf "http://localhost:${FRONTEND_PORT}/api/health" | grep -q '"db":"ok"'; then
    echo "✓ Backend arriba y conectado a la base (health ok, directo y vía nginx)"
    echo "Listo. Si algo falla, restaurar con: cp $backup $ENV_FILE && docker compose up -d backend"
    exit 0
  fi
done

echo "✗ El backend no respondió el health check. Revisar: docker compose logs backend" >&2
echo "  Para volver atrás: cp $backup $ENV_FILE && docker compose up -d backend" >&2
exit 1
