---
name: code-review
description: >
  Use when the user wants a code review of the portfolio codebase. Triggers: "revisá el código",
  "hacé un code review", "qué tan limpio está el código", "encontrá bugs", "mejorá la calidad",
  "revisá seguridad", "auditá el backend". Reviews cover: TypeScript correctness, security,
  performance, accessibility (a11y), dead code, test coverage gaps, and architectural consistency.
---

# Code Review Skill

Perform a systematic code review of the portfolio. Cover frontend and backend.
Report findings by severity. Never auto-fix — present findings first, then ask what to address.

## Review scope

### Frontend: `frontend/src/`

**Components to review:**
- `components/NavigationBar/`
- `components/ParticlesBackground/`
- `components/sections/HeroSection/`
- `components/sections/AboutSection/`
- `components/sections/ProjectsSection/`
- `components/sections/ContactSection/`
- `components/Footer/`
- `components/Toast/`
- `pages/admin/` (LoginPage, AdminLayout, MessagesPage, ProjectsPage)
- `pages/admin/AuthGuard.tsx`
- `api/client.ts`
- `hooks/`
- `motion/`

**Backend files to review:**
- `backend/src/index.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/routes/auth.ts`
- `backend/src/routes/contact.ts`
- `backend/src/routes/messages.ts`
- `backend/src/routes/projects.ts`
- `backend/src/schemas/`

## Review checklist

### 1. TypeScript correctness
- `any` types that should be typed properly
- Missing `null` checks on optional chaining
- Unsafe type assertions (`as SomeType`) without validation
- Unused imports and dead code
- Missing return types on exported functions

### 2. Security (critical — always check these)
- **JWT**: Is `JWT_SECRET` validated at startup? Is `exp` checked? Is the algorithm pinned?
- **SQL injection**: Are all queries parameterized? No string concatenation into SQL.
- **XSS**: Is user input ever rendered as `dangerouslySetInnerHTML`?
- **CORS**: Is `cors()` configured to specific origins, not `*`?
- **Rate limiting**: Is there rate limiting on `/api/contact` and `/api/auth/login`?
- **Zod validation**: Every public endpoint must validate with Zod before the handler runs.
- **Auth middleware**: `verifyToken` must guard ALL mutating routes (POST/PUT/DELETE).
- **Password hash**: bcrypt with cost ≥ 10.
- **Env vars**: No secrets hardcoded; all required vars validated at startup (hard exit if missing).

### 3. React patterns
- Missing `key` props in lists
- Effects with missing/incorrect dependencies
- State updates after unmount (memory leaks)
- Unnecessary re-renders (missing `useCallback`/`useMemo` for expensive ops)
- `useEffect` that should be an event handler
- Controlled vs uncontrolled input mixing

### 4. Accessibility (a11y)
- All `<img>` must have `alt`
- All interactive `<div>` or `<span>` must be `<button>` or have `role` + `tabIndex`
- Form inputs must have associated `<label>` (via `htmlFor` or `aria-label`)
- Dynamic content must have `role="alert"` or `aria-live` where appropriate
- Focus management: modals/menus must trap focus and restore it on close
- Color alone must not convey meaning (check error states)

### 5. Performance
- Large dependencies imported without tree-shaking (check `import * as`)
- Non-lazy-loaded heavy components (Three.js `ParticlesBackground` — should be `lazy()`)
- Images without `width`/`height` (layout shift)
- `useEffect` fetching without cleanup / abort controller

### 6. CSS Modules conventions
- Hardcoded hex values instead of CSS custom properties
- Hardcoded px values that have a `--fs-*` or spacing token
- `!important` usage (flag all occurrences — must be justified)
- Duplicate rules across module files

### 7. Test coverage gaps
- Check `__tests__/` directories for each component
- Identify components with zero tests
- Identify backend routes with no integration tests
- Note: tests use Vitest + fast-check (property-based) — flag missing property tests

### 8. Architecture consistency
- Does every API call go through `api/client.ts` (`apiClient`)? Flag any direct `fetch()` calls.
- Do all data hooks follow the established pattern (fetch on mount, optimistic updaters)?
- Are all animations using tokens from `motion/tokens.ts` and variants from `motion/variants.ts`?
- Is `useReducedMotion` checked before heavy animations?

## How to run the review

1. Read each file listed in the scope above.
2. Run TypeScript type-check:
```bash
cd /home/gus/Portfolio/portafolio/frontend && npx tsc --noEmit 2>&1 | head -60
cd /home/gus/Portfolio/portafolio/backend && npx tsc --noEmit 2>&1 | head -60
```
3. Run the test suite:
```bash
cd /home/gus/Portfolio/portafolio/frontend && npx vitest --run 2>&1 | tail -30
cd /home/gus/Portfolio/portafolio/backend && npx vitest --run 2>&1 | tail -30
```
4. Search for known anti-patterns:
```bash
grep -rn "dangerouslySetInnerHTML" /home/gus/Portfolio/portafolio/frontend/src/
grep -rn "any" /home/gus/Portfolio/portafolio/frontend/src/ | grep -v "\.test\." | grep -v "//.*any"
grep -rn "!important" /home/gus/Portfolio/portafolio/frontend/src/
grep -rn "fetch(" /home/gus/Portfolio/portafolio/frontend/src/ | grep -v "apiClient"
grep -rn "console\.log" /home/gus/Portfolio/portafolio/backend/src/
```

## Report format

```
## Code Review — [date]

### 🔴 Critical (security / data loss risk)
- [file:line] — [issue] — [recommended fix]

### 🟠 High (bugs / broken behavior)
- [file:line] — [issue] — [recommended fix]

### 🟡 Medium (code quality / maintainability)
- [file:line] — [issue] — [recommended fix]

### 🟢 Low (style / minor improvements)
- [file:line] — [issue] — [recommended fix]

### ✓ Looks good
- [area]: [brief note]

### Test coverage gaps
- [component/route]: no tests

### Summary
[2-3 sentence overall assessment]
```

Present the full report. Then ask the user which severity levels to address.
Fix only what the user approves — do not auto-apply "obvious" fixes without confirmation.
