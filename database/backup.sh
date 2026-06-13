#!/bin/sh
# Backup periódico de Postgres vía pg_dump, con rotación.
# Corre como servicio en docker-compose (imagen postgres:16-alpine).
#
# Variables (con defaults):
#   PGHOST            host de la DB           (default: postgres)
#   POSTGRES_USER     usuario                 (default: portfolio_user)
#   POSTGRES_DB       base                    (default: portfolio)
#   PGPASSWORD        contraseña              (requerida)
#   BACKUP_INTERVAL   segundos entre backups  (default: 86400 = 1 día)
#   BACKUP_KEEP       cuántos conservar       (default: 7)
#   BACKUP_DIR        destino                 (default: /backups)
set -eu

PGHOST="${PGHOST:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-portfolio_user}"
POSTGRES_DB="${POSTGRES_DB:-portfolio}"
BACKUP_INTERVAL="${BACKUP_INTERVAL:-86400}"
BACKUP_KEEP="${BACKUP_KEEP:-7}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

mkdir -p "$BACKUP_DIR"

log() { echo "[backup $(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }

backup_once() {
  ts=$(date -u '+%Y%m%d-%H%M%S')
  out="$BACKUP_DIR/${POSTGRES_DB}-${ts}.sql.gz"
  tmp="${out}.partial"
  log "Generando $out"
  # --clean: el dump incluye DROPs para restaurar sobre una base existente.
  if pg_dump -h "$PGHOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
      | gzip > "$tmp"; then
    mv "$tmp" "$out"
    log "OK ($(du -h "$out" | cut -f1))"
  else
    rm -f "$tmp"
    log "ERROR: pg_dump falló"
    return 1
  fi

  # Rotación: conservar solo los $BACKUP_KEEP más nuevos.
  count=$(ls -1 "$BACKUP_DIR"/${POSTGRES_DB}-*.sql.gz 2>/dev/null | wc -l)
  if [ "$count" -gt "$BACKUP_KEEP" ]; then
    ls -1t "$BACKUP_DIR"/${POSTGRES_DB}-*.sql.gz | tail -n +"$((BACKUP_KEEP + 1))" | while read -r old; do
      log "Rotando (borrando) $old"
      rm -f "$old"
    done
  fi
}

log "Servicio de backup iniciado · intervalo=${BACKUP_INTERVAL}s · conservar=${BACKUP_KEEP}"
while true; do
  backup_once || log "backup falló, reintento en el próximo ciclo"
  sleep "$BACKUP_INTERVAL"
done
