---
name: design-review
description: >
  Use when the user provides a Claude Design handoff image (mockup, screenshot, or Figma export)
  and wants to match or compare it against the live implementation. Triggers: "hacé que se vea como
  la imagen", "comparalo con el diseño", "matcheá el diseño", "Claude Design", or any time the user
  attaches a design image and asks to implement or verify it.
---

# Design Review Skill

Compare a Claude Design handoff image against the live implementation, then apply the necessary
changes to make them match.

## Workflow

### 1. Understand the design image
- Read the image carefully: layout, spacing, typography, colors, component structure.
- Identify which section/component it maps to (HeroSection, AboutSection, ContactSection, etc.).
- Note the exact CSS custom properties used in this project:
  - Colors: `--ink`, `--ink-dim`, `--ink-mute`, `--bg`, `--bg-1`, `--accent`, `--rule`, `--hairline`
  - Font families: `--mono`, `--serif`
  - Font sizes: `--fs-10` through `--fs-36`
  - Spacing: use multiples of 4px or 8px; prefer 16/24/32/48/80px
  - Transitions: `--t-base`, `--t-slow`

### 2. Take a screenshot of the current state
```bash
# Ensure the dev or Docker stack is running first
# Frontend: cd frontend && npm run dev  (port 5173)
# Docker:   docker compose up -d        (port 8080)

node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:5173');  // or 8080 for Docker
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/home/gus/.claude/jobs/\$CLAUDE_JOB_DIR_NAME/before.png', fullPage: true });
  await b.close();
})();
"
```

### 3. Build the diff list
Create a numbered list of discrepancies between design image and screenshot:
- Layout: grid columns, gap, alignment, padding, margin
- Typography: font-family, font-size, font-weight, line-height, letter-spacing, text-transform
- Colors: background, text color, border color, accent usage
- Components: missing elements, wrong order, incorrect nesting
- States: hover effects, focus rings, transitions
- Responsiveness: if the design shows mobile, check `max-width: 800px` / `max-width: 900px`

### 4. Apply changes
- Edit CSS Modules files (`.module.css`) — never use inline styles.
- Edit TSX files only when the DOM structure itself must change.
- Always use existing CSS custom properties — never hardcode hex values or px sizes that
  have a token equivalent.
- Prefer adding new classes over modifying rules that affect many components.

### 5. Verify
```bash
# Take an after screenshot and compare
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/home/gus/.claude/jobs/\$CLAUDE_JOB_DIR_NAME/after.png', fullPage: true });
  await b.close();
})();
"
```
Read both images and confirm all discrepancies from step 3 are resolved.

## Key design conventions in this project

| Element | Convention |
|---------|-----------|
| Section numbers | `.num` — `--mono`, `--fs-36`, `--ink-mute` |
| Section titles | `.title` — `--mono`, `--fs-28`, bold, lowercase |
| Section meta | `.meta` — `--mono`, `--fs-11`, uppercase, `--ls-wider` |
| Accent color | `var(--accent)` — used for `//` symbols, highlights, hover states |
| Card headers | `background: var(--ink); color: var(--bg)` — dark bar on top of cards |
| Card bodies | `background: var(--bg-1)` — slightly off-white |
| Inputs/fields | `background: var(--bg)` — pure white, lighter than card |
| Borders | `1px solid var(--rule)` for components, `1px solid var(--hairline)` for rows |
| Tags/chips | `border: 1px solid var(--hairline)`, uppercase mono, `--fs-11` |
| Buttons | `background: var(--ink)`, hover to `var(--accent)` |
| Section padding | `80px 48px` desktop, `48px 20px` mobile |
| Grid breakpoint | `max-width: 900px` for most sections, `max-width: 800px` for nav |

## Common pitfalls

- CSS specificity: `.parent child { color }` beats `.child { color }` — check cascade before
  adding `!important`.
- `var(--bg)` vs `var(--bg-1)`: bg is the page background (pure/warm white), bg-1 is the
  slightly darker card background.
- Never hardcode `#c1272d` — use `var(--accent)`.
- `resize: none` on textareas that should not be user-resizable.
- Font size tokens go up in steps: 10, 11, 12, 13, 14, 16, 18, 22, 28, 36.
