# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev          # dev server → http://localhost:5173
npm run build        # tsc + vite build
npm run lint         # eslint
npx vitest --run     # run all tests once
npx vitest --run src/path/to/file.test.tsx   # run a single test file
```

### Backend (`cd backend`)
```bash
npm run dev          # ts-node dev server → http://localhost:3001
npm run build        # tsc → dist/
npm run test         # vitest --run (alias)
npx vitest --run src/path/to/file.test.ts    # run a single test file
```

### Docker (full stack)
```bash
docker compose up --build -d   # rebuild + start all services
docker compose down            # stop
docker compose logs backend    # backend logs
docker compose logs -f         # follow all logs

# Apply a new migration to a running container (never recreate volume in prod):
docker exec -i portafolio-postgres-1 psql -U portfolio_user -d portfolio < database/migrations/002_xyz.sql
```

### Hash generation (before first run)
```bash
cd backend && npm install
node -e "const b=require('bcrypt');b.hash('YOUR_PASSWORD',12).then(console.log)"
```
Paste the output into `ADMIN_PASSWORD_HASH` in `.env`. Escape `$` as `$$` in the file.

---

## Environment setup

Root-level `.env` is read by Docker Compose. Frontend reads `frontend/.env` only during local dev (`VITE_API_URL=http://localhost:3001`). In Docker, `VITE_API_URL=/api` is injected at build time via `ARG`.

Backend validates **all** required env vars at startup and hard-exits if any are missing (`src/index.ts`). Required vars:
`DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `PORT`, `CORS_ORIGIN`, `RESEND_API_KEY`, `RECIPIENT_EMAIL`

**Important:** the backend runs `runMigrations()` (`src/utils/runMigrations.ts`) at startup: it applies any pending `database/migrations/*.sql` files (tracked in the `schema_migrations` table) inside a transaction. Restarting the backend container is enough to apply a new migration — write migrations idempotently (`IF NOT EXISTS`) since `docker-entrypoint-initdb.d` may have already applied early ones on first volume creation. Manual `docker exec ... psql < migration.sql` is only needed if you can't restart the backend.

---

## Architecture

### Request path (Docker)
```
Browser → Nginx :8080 → /api/* → backend:3001
                       → /*    → React SPA (index.html fallback)
```
Nginx config is a template at `infra/nginx/nginx.conf`; `${FRONTEND_PORT}` and `${BACKEND_PORT}` are substituted by the official nginx image's entrypoint before startup.

### Auth flow
- Login POST `/api/auth/login` returns a JWT (8h expiry, HS256), stored in `localStorage`.
- `AuthGuard` (`frontend/src/pages/admin/AuthGuard.tsx`) decodes the token client-side using base64url-safe `atob` to check `exp` before rendering protected routes. Expired tokens redirect to login with a message via React Router state.
- Backend `verifyToken` middleware (`src/middleware/auth.ts`) guards all mutating routes (`POST/PUT/DELETE` on `/api/projects`, all `/api/messages` mutations, `PATCH /api/status`).
- The `/api/auth/login` route has a **DB fallback**: if no row exists in `admin_users` for the username, it compares against `ADMIN_USERNAME`/`ADMIN_PASSWORD_HASH` env vars directly (`src/routes/auth.ts:30–55`). This means manual DB insertion is never required.
- Rate limiting: `loginLimiter` (10 req/15min) on `/api/auth/login`, `contactLimiter` (5 req/15min) on `/api/contact`.

### API client (frontend)
`src/api/client.ts` exports `apiClient<T>(path, options)`:
- Automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- Handles `204 No Content` → returns `undefined`.
- Throws `ApiError(status, message)` on non-ok responses.
- Deduplicates the `/api` prefix when `VITE_API_URL` already ends with `/api`.
- Default fallback: `http://localhost:3001` (backend local dev port).

### Data hooks pattern
`useProjects`, `useMessages`, and `useWorkStatus` own their own state. They fetch on mount with `AbortController` cleanup and expose optimistic updaters that mutate local state after a successful API call — no external state manager.

### Work status feature
`GET /api/status` (public) returns the current work availability. `PATCH /api/status` (JWT-protected) updates it. Values: `'open' | 'working' | 'occupied'`. Stored in `site_settings` table (key `work_status`). The HeroSection fetches the status on mount and renders the appropriate terminal line and colored status dot. Admin can change it from `/admin/settings`.

### Motion system
`src/motion/` is a self-contained animation layer:
- `tokens.ts` — design tokens: `duration`, `ease`, `spring`, `stagger`, `offset`
- `variants.ts` — reusable Framer Motion variants built from tokens (`fadeUp`, `cinematicFadeUp`, `staggerContainer`, `scaleIn`, `slideInLeft`, `overlayReveal`)
- `hooks/useInView.ts` — wraps Framer Motion's `useInView` with project defaults (`once: true`, `amount: 0.15`, `-60px` bottom margin)
- `hooks/useReducedMotion.ts` — must be checked before running heavy animations

Always compose from existing variants/tokens. Do not hardcode duration or easing values.

### Three.js particles (`ParticlesBackground`)
Lazy-loaded via `React.lazy()` + `Suspense`. Canvas-based 5-layer particle system with wander drift, mouse repulsion, depth-sorted connections, and parallax. Respects `prefers-reduced-motion`. Entirely self-contained — do not share its canvas context.

### Backend validation
All incoming request bodies are validated with Zod via the `validate` middleware before reaching route handlers. `req.body` is replaced with the parsed (typed) output, so handlers can trust the shape. Contact form (`/api/contact`) and status read (`GET /api/status`) are **public** — no JWT required.

### Database
Migrations live in `database/migrations/` (numbered: `001_init.sql`, `002_site_settings.sql`, …). Tables: `projects`, `messages`, `admin_users`, `site_settings`. All IDs are UUIDs (`gen_random_uuid()`). Column `site_settings.key` is the PRIMARY KEY (varchar).

### Admin panel
Routes under `/admin/*` protected by `AuthGuard`. Keyboard shortcuts:
- `/` → focus search, `n` → new project
- `g p` → projects, `g m` → messages, `g s` → settings, `Esc` → cancel

---

## Testing

Tests use Vitest with property-based testing via `fast-check`. Frontend tests run in `jsdom`. Backend tests use `supertest` against the Express app (DB is mocked with `vi.mock`).

Test files live in `__tests__/` directories next to the code they test.

Current coverage: 111 frontend tests (8 files), 44 backend tests (12 files). All passing.

**Coverage gaps** (see TAREAS.md): admin pages (`LoginPage`, `AdminLayout`, `MessagesPage`, `ProjectsPage`, `SettingsPage`), `ConfirmDialog`, `contact.ts` route, E2E flows.

---

## Available skills (`/skill-name`)

These project-specific skills are installed and ready to use:

| Skill | Trigger | What it does |
|-------|---------|--------------|
| `/code-review` | "revisá el código", "code review", "encontrá bugs" | Systematic review: TypeScript, security, perf, a11y, dead code, tests. Levels: `low`, `medium`, `high`, `ultra`. Add `--fix` to apply findings. |
| `/visual-audit` | "auditá la página", "checkeá el responsive", "revisá el diseño" | Full visual audit with Playwright screenshots at 1440/768/390px. Checks contrast, layout, hover states, broken links, console errors. |
| `/security-review` | "revisá seguridad", "security review" | Focused security analysis of the current diff: injection, auth bypass, XSS, data exposure. |
| `/verify` | "verificá que funciona", "testeá el cambio" | Runs the app and checks a change works in the real browser, not just tests. |
| `/design-review` | "comparalo con el diseño", attach a design image | Compares a design handoff (mockup/screenshot) against the live implementation. |
| `/frontend-design` | "construí un componente", "hacé la UI de X" | Creates polished, production-grade frontend components with high design quality. |
| `/run` | "arrancá la app", "levantá el servidor" | Launches the app (dev or Docker) and confirms it's running. |

### Visual screenshots (Playwright)
Playwright is installed at `/tmp/node_modules/playwright`. To take screenshots without the visual-audit skill:
```bash
cd /tmp && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:8080');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/screenshot.png', fullPage: true });
  await b.close();
})();
"
```
