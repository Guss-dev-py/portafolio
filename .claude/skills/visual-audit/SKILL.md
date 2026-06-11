---
name: visual-audit
description: >
  Use when the user wants a full visual and technical audit of the portfolio page.
  Triggers: "auditá la página", "revisá todo", "qué problemas tiene el diseño",
  "checkeá el responsive", "revisá accesibilidad", "detectá cada detalle".
  Performs a systematic review of: WCAG contrast, responsive layout, hover states,
  animations, spacing consistency, typography, broken links, and visual regressions.
---

# Visual Audit Skill

Perform a comprehensive visual and technical audit of the portfolio. Cover every section,
every viewport, every interactive state.

## Audit checklist

Run through ALL of the following. Skip nothing.

### 0. Stack check
```bash
# Confirm the app is running before taking screenshots
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 || \
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080
```
If neither responds, start the dev server: `cd /home/gus/Portfolio/portafolio/frontend && npm run dev &`

### 1. Desktop screenshots (1440px wide)
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(2000);

  // Full page
  await p.screenshot({ path: '/tmp/audit-desktop-full.png', fullPage: true });

  // Each section viewport
  for (const id of ['sobre', 'proyectos', 'contacto']) {
    await p.evaluate(id => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
    }, id);
    await p.waitForTimeout(300);
    await p.screenshot({ path: \`/tmp/audit-desktop-\${id}.png\` });
  }

  await b.close();
  console.log('Desktop screenshots done');
})();
"
```

### 2. Mobile screenshot (390px — iPhone 14)
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/audit-mobile-full.png', fullPage: true });

  // Test hamburger menu
  await p.click('button[aria-label]');
  await p.waitForTimeout(500);
  await p.screenshot({ path: '/tmp/audit-mobile-menu.png' });

  await b.close();
  console.log('Mobile screenshots done');
})();
"
```

### 3. Tablet screenshot (768px)
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 768, height: 1024 });
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/audit-tablet-full.png', fullPage: true });
  await b.close();
  console.log('Tablet screenshots done');
})();
"
```

### 4. Read and analyze each screenshot
For every screenshot taken, use the Read tool to view it, then note:

**Layout issues:**
- Elements overflowing their containers
- Collapsed/broken grids
- Misaligned items
- Excessive or missing whitespace

**Typography issues:**
- Font not rendering (fallback to system sans-serif)
- Text too small to read (< 14px on body, < 11px on labels)
- Truncated text without ellipsis
- Missing letter-spacing on uppercase labels

**Color/contrast issues:**
- Text on background with insufficient contrast (WCAG AA: 4.5:1 for body, 3:1 for large text)
- Check specifically: `--ink-mute` on `--bg-1` (gray on off-white can fail)
- Check: `--accent` (red) on dark backgrounds
- Check footer: light text on dark background

**Spacing consistency:**
- Section padding should be `80px 48px` desktop / `48px 20px` mobile
- Gaps between sections should use the `--rule` border (2px solid)
- Card internal padding: 16px or 20px — check it's not mixed arbitrarily

**Interactive states (test with Playwright hover/focus):**
- Nav links: hover background + color change
- CTA links (email, LinkedIn, GitHub): hover padding-left shift + accent color
- Stack tags: hover → dark fill
- Submit button: hover → accent color
- All `<a>` and `<button>` elements must have visible focus ring (outline)

### 5. Test hover states
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(1500);

  // Hover over a nav link
  await p.hover('.topnav a:first-child, nav a:first-child');
  await p.screenshot({ path: '/tmp/audit-hover-nav.png' });

  // Scroll to contact and hover email link
  await p.evaluate(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(300);
  await p.hover('button.caButton, [class*=\"caLink\"]');
  await p.screenshot({ path: '/tmp/audit-hover-cta.png' });

  await b.close();
  console.log('Hover screenshots done');
})();
"
```

### 6. Check for broken links
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(1500);

  const links = await p.evaluate(() =>
    [...document.querySelectorAll('a[href]')]
      .map(a => ({ text: a.textContent?.trim(), href: a.href }))
  );
  console.log(JSON.stringify(links, null, 2));

  await b.close();
})();
"
```
Check: cv.pdf link (404 risk if file not uploaded), LinkedIn URL, GitHub URL.

### 7. Console errors check
```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errors = [];
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('http://localhost:5173');
  await p.waitForTimeout(2000);
  console.log('Console errors:', JSON.stringify(errors, null, 2));
  await b.close();
})();
"
```

### 8. Report format

Produce a structured report:

```
## Visual Audit Report — [date]

### ✓ Passing
- [item]: [brief note]

### ⚠ Minor issues
- [section] → [issue] → [suggested fix]

### ✗ Critical issues
- [section] → [issue] → [suggested fix]

### Broken links
- [url] → [status]

### Console errors
- [error text]
```

Ask the user which issues to fix before proceeding. Don't auto-fix everything — some issues
may be intentional design decisions.
