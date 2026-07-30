# ADR 0005 — Login con fallback a variables de entorno

- **Estado:** aceptada
- **Fecha de la decisión:** original del proyecto (documentada retroactivamente el 2026-07-29)

## Contexto

El panel admin tiene **un solo usuario**: el dueño del portfolio. Un flujo de autenticación normal exigiría sembrar la tabla `admin_users` con un hash de bcrypt antes del primer login — un paso manual, propenso a error, y que hay que repetir cada vez que se recrea el volumen de la base.

## Decisión

`POST /api/auth/login` intenta primero contra la tabla `admin_users`. **Si no existe fila para ese usuario**, compara contra las variables de entorno `ADMIN_USERNAME` y `ADMIN_PASSWORD_HASH` (`routes/auth.ts:30-55`).

Nunca hace falta insertar el admin a mano en la base.

## Fundamento

1. **El arranque en frío funciona solo.** `docker compose up` con un `.env` bien puesto da un sistema utilizable, sin paso manual de seeding.
2. **La contraseña nunca se guarda en claro en ningún lado.** `ADMIN_PASSWORD_HASH` es un hash de bcrypt (coste 12), igual que lo que iría en la base.
3. **La tabla sigue siendo la autoridad cuando existe la fila** — el camino de migración a multiusuario queda abierto sin cambiar el endpoint.

## Consecuencias

**Positivas:** despliegue reproducible; recrear el volumen no rompe el acceso; el `.env` es la única fuente de configuración.

**Negativas y riesgos:**

- **Quien lea el `.env` puede cambiar la contraseña del admin.** Aceptable para un despliegue de una sola persona; **no** sería aceptable en multiusuario.
- El `$` de los hashes de bcrypt **hay que escaparlo como `$$`** en el archivo `.env` leído por Docker Compose. Es un error clásico y silencioso: el login falla sin explicar por qué.
- Dos caminos de autenticación significa **dos caminos que testear**. Ambos están cubiertos.
- El rate limiting (`loginLimiter`, 10 intentos / 15 min) aplica igual a los dos caminos — importante, porque el fallback por env var es el que siempre está disponible.

## Alternativas descartadas

- **Seeding obligatorio de `admin_users`** — paso manual que hay que repetir en cada entorno nuevo.
- **Comparar la contraseña en texto plano contra una env var** — inaceptable: quedaría la contraseña en claro en disco y en los logs de Compose.
