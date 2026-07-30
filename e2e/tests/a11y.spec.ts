import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accesibilidad WCAG 2.2 AA y contenido para crawlers sin JavaScript.
 *
 * Existe por una razón concreta: **Lighthouse no cubre ninguna de las dos cosas**
 * y el proyecto puntúa 100 en su categoría de accesibilidad igual.
 *
 * - No audita `target-size` (WCAG 2.5.8, nuevo en 2.2) ni detecta un
 *   `outline: none` sin reemplazo. Fueron los dos hallazgos más serios de la
 *   Fase 5 y Lighthouse los daba por buenos.
 * - Ejecuta JavaScript, así que ve la página ya renderizada. El app shell —el
 *   HTML de respaldo para ChatGPT, Perplexity y Claude, que no ejecutan JS— le
 *   resulta invisible: puntúa igual con y sin él (medido en la Fase 6.2).
 *
 * Hasta acá esas dos cosas se verificaban a mano y el riesgo quedaba anotado en
 * un `.md`. Una advertencia escrita no frena una regresión; este archivo sí.
 *
 * Tiene que correr en un navegador de verdad: contraste y tamaño de target
 * necesitan layout y CSS calculados, y en jsdom no existen.
 */

const ETIQUETAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

const VIEWPORTS = [
  { nombre: 'desktop', width: 1440, height: 900 },
  { nombre: 'tablet', width: 768, height: 1024 },
  { nombre: 'móvil', width: 390, height: 844 },
] as const;

/** Recorre la página entera para que axe vea también lo que entra por scroll. */
async function prepararPagina(page: Page, tema: 'light' | 'dark') {
  await page.goto('/');
  if (tema === 'dark') {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });
  }
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  // El puntero queda donde lo dejó la última interacción y puede activar un
  // `:hover` sin querer, lo que vuelve el escaneo no determinista. Se aparta.
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
}

/** Un renglón por violación, con el selector: si falla, se sabe dónde tocar. */
function describirViolaciones(violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations']) {
  return violations
    .map((v) => {
      const nodos = v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n      ');
      return `  [${v.impact}] ${v.id} — ${v.help}\n      ${nodos}`;
    })
    .join('\n');
}

test.describe('Accesibilidad WCAG 2.2 AA — sitio público', () => {
  for (const tema of ['light', 'dark'] as const) {
    for (const vp of VIEWPORTS) {
      test(`sin violaciones en tema ${tema} a ${vp.nombre} (${vp.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await prepararPagina(page, tema);

        const { violations } = await new AxeBuilder({ page })
          .withTags(ETIQUETAS_WCAG)
          .analyze();

        expect(violations.length, `Violaciones WCAG 2.2 AA:\n${describirViolaciones(violations)}`).toBe(0);
      });
    }
  }
});

test.describe('Accesibilidad WCAG 2.2 AA — panel admin', () => {
  const USER = process.env.E2E_ADMIN_USER;
  const PASS = process.env.E2E_ADMIN_PASS;
  test.skip(!USER || !PASS, 'Definí E2E_ADMIN_USER y E2E_ADMIN_PASS para auditar el admin');

  // El admin tiene su propio tema (fósforo verde) además de heredar el público.
  // La Fase 5 encontró que el sospechoso era el tema claro, no el hacker, así
  // que se auditan los tres.
  const TEMAS_ADMIN = [
    { nombre: 'paper claro', admin: 'paper', sitio: 'light' },
    { nombre: 'paper oscuro', admin: 'paper', sitio: 'dark' },
    { nombre: 'hacker', admin: 'hacker', sitio: 'light' },
  ] as const;

  const RUTAS = ['/admin/projects', '/admin/messages', '/admin/settings', '/admin/logs'];

  for (const tema of TEMAS_ADMIN) {
    test(`sin violaciones en las 4 pantallas, tema ${tema.nombre}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/admin/login');
      await page.getByLabel('USUARIO').fill(USER!);
      await page.getByLabel('CONTRASEÑA').fill(PASS!);
      await page.getByRole('button', { name: /iniciar sesión/i }).click();
      await expect(page).toHaveURL(/\/admin\/(?!login)/);

      await page.evaluate(
        ([admin, sitio]) => {
          localStorage.setItem('admin-theme', admin);
          localStorage.setItem('theme', sitio);
        },
        [tema.admin, tema.sitio]
      );

      for (const ruta of RUTAS) {
        await page.goto(ruta);
        await page.waitForTimeout(1500);

        const { violations } = await new AxeBuilder({ page })
          .withTags(ETIQUETAS_WCAG)
          .analyze();

        expect(
          violations.length,
          `${ruta} (${tema.nombre}):\n${describirViolaciones(violations)}`
        ).toBe(0);
      }
    });
  }

  /**
   * Los estados de hover pintan fondos distintos y por lo tanto tienen su
   * propio contraste. Un escaneo estático no los ve nunca.
   *
   * Esto no es hipotético: la tarjeta de estado laboral en Ajustes pasaba en
   * reposo y fallaba al pasarle el mouse por encima (`--bg-2` de fondo con
   * `--ink-mute` de texto, 3,87:1). Se descubrió porque el puntero quedó
   * parado encima por casualidad. Ahora se prueba a propósito.
   */
  test('las tarjetas de Ajustes mantienen el contraste con el mouse encima', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/admin/login');
    await page.getByLabel('USUARIO').fill(USER!);
    await page.getByLabel('CONTRASEÑA').fill(PASS!);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/admin\/(?!login)/);
    await page.goto('/admin/settings');
    await page.waitForTimeout(1500);

    const tarjetas = page.locator('[class*="optionCard"]');
    const total = await tarjetas.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      await tarjetas.nth(i).hover();
      await page.waitForTimeout(250);

      const { violations } = await new AxeBuilder({ page })
        .withTags(ETIQUETAS_WCAG)
        .analyze();

      expect(
        violations.length,
        `con el mouse sobre la tarjeta ${i + 1}:\n${describirViolaciones(violations)}`
      ).toBe(0);
    }
  });
});

test.describe('Contenido para crawlers que no ejecutan JavaScript', () => {
  /**
   * Esto es lo que Lighthouse no puede ver: pide el HTML crudo, sin navegador.
   * Es exactamente lo que hacen ChatGPT, Perplexity y Claude.
   */
  test('el HTML servido trae texto real, no un div vacío', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);

    const html = await res.text();
    const body = /<body[^>]*>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
    const texto = body
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Antes del app shell esto era 0. El piso protege el propósito; el techo
    // protege el LCP (la versión larga costaba ~450-540 ms — ver ADR 0010).
    expect(texto.length).toBeGreaterThan(250);
    expect(texto.length).toBeLessThan(700);

    // Lo que un crawler necesita para poder citar el sitio.
    expect(texto).toContain('Augusto Freire');
    expect(texto).toMatch(/FullStack Developer/i);
    expect(html).toMatch(/<h1[^>]*>\s*Augusto Freire/);
    expect(texto).toMatch(/React/);
    expect(html).toContain('mailto:');
  });

  test('un navegador con JavaScript no ve ni rastro del respaldo', async ({ page }) => {
    // El shell vive dentro de #root y React vacía el contenedor al montar. Si
    // esto fallara, el visitante estaría viendo contenido duplicado.
    await page.goto('/');
    await page.waitForTimeout(2500);

    expect(await page.locator('[data-app-shell]').count()).toBe(0);
    expect(await page.locator('h1').count()).toBeGreaterThan(0);
  });
});
