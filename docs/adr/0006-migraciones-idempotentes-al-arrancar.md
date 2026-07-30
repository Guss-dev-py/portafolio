# ADR 0006 — Migraciones idempotentes aplicadas al arrancar el backend

- **Estado:** aceptada
- **Fecha de la decisión:** original del proyecto (documentada retroactivamente el 2026-07-29)

## Contexto

El esquema vive en `database/migrations/*.sql`, numerado. Hay **dos** mecanismos que pueden aplicar SQL:

1. `docker-entrypoint-initdb.d` de la imagen de Postgres, que corre **solo** al crear el volumen por primera vez.
2. El propio backend.

Con solo el primero, agregar una migración a un sistema en producción obligaría a destruir el volumen — o sea, perder los datos.

## Decisión

El backend ejecuta **`runMigrations()` antes de `app.listen()`** (`index.ts:73-82`). Aplica los `.sql` pendientes dentro de una transacción y lleva registro en la tabla `schema_migrations`.

**Si una migración falla, el servidor no arranca** (`process.exit(1)`).

**Todas las migraciones deben escribirse de forma idempotente** (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), porque `docker-entrypoint-initdb.d` pudo haber aplicado ya las primeras.

## Fundamento

1. **Reiniciar el contenedor del backend alcanza para migrar.** Nunca hay que tocar el volumen en producción.
2. **Fallar al arrancar es lo correcto.** Un servidor corriendo contra un esquema a medio migrar corrompe datos; uno que no arranca es un problema visible e inmediato.
3. **La idempotencia es obligatoria** justamente porque los dos mecanismos coexisten y se pisan.
4. **La transacción** evita que quede una migración aplicada por la mitad.

## Consecuencias

**Positivas:** despliegues sin pérdida de datos; el esquema queda al día automáticamente; un solo camino operativo.

**Negativas:** el arranque del backend depende de que la base esté disponible. Una migración mal escrita **tira el servicio entero**, no solo la funcionalidad que toca — la contrapartida deliberada de "fallar ruidoso". El `docker exec ... psql < migration.sql` manual queda solo como salida de emergencia para cuando no se puede reiniciar el backend.
