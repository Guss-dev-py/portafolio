import { test, expect } from '@playwright/test';

/**
 * Flujo completo: login → crear proyecto → verlo en el portfolio público →
 * eliminarlo. Necesita credenciales reales del admin:
 *   E2E_ADMIN_USER=... E2E_ADMIN_PASS=... npm test
 */
const USER = process.env.E2E_ADMIN_USER;
const PASS = process.env.E2E_ADMIN_PASS;

test.describe('Flujo admin completo', () => {
  test.skip(!USER || !PASS, 'Definí E2E_ADMIN_USER y E2E_ADMIN_PASS para correr este flujo');

  const projectName = `E2E Proyecto ${Date.now()}`;

  /**
   * El borrado vive dentro del test, así que si el test falla antes de llegar
   * ahí el proyecto queda en la base — y esta suite corre contra el stack real,
   * con los datos de verdad. Pasó: un fallo intermitente dejó un
   * "E2E Proyecto …" publicado en el portfolio público hasta que lo encontró la
   * comparación visual del cierre. Esta limpieza corre pase lo que pase.
   */
  test.afterAll(async ({ playwright }, testInfo) => {
    if (!USER || !PASS) return;
    const api = await playwright.request.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
      const login = await api.post('/api/auth/login', { data: { username: USER, password: PASS } });
      if (!login.ok()) return;
      const { token } = await login.json();
      const headers = { Authorization: `Bearer ${token}` };

      const res = await api.get('/api/projects');
      if (!res.ok()) return;
      const proyectos: Array<{ id: string; name: string }> = await res.json();

      for (const p of proyectos.filter((p) => p.name.startsWith('E2E Proyecto '))) {
        await api.delete(`/api/projects/${p.id}`, { headers });
        console.log(`[limpieza] proyecto de test eliminado: ${p.name}`);
      }
    } finally {
      await api.dispose();
    }
  });

  test('login → crear proyecto → visible en público → eliminar', async ({ page }) => {
    // ── Login ──────────────────────────────────────────────────────
    await page.goto('/admin/login');
    await page.getByLabel('USUARIO').fill(USER!);
    await page.getByLabel('CONTRASEÑA').fill(PASS!);
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole('heading', { name: 'Proyectos' })).toBeVisible();

    // ── Crear proyecto ─────────────────────────────────────────────
    await page.getByRole('button', { name: '+ Nuevo proyecto [n]' }).click();
    await page.getByLabel('NOMBRE *').fill(projectName);
    await page.getByLabel('DESCRIPCIÓN *').fill('Proyecto creado por el test E2E. Se elimina al final.');
    await page.getByLabel(/TECNOLOGÍAS \*/).fill('Playwright, TypeScript');
    await page.getByLabel('URL DEL PROYECTO *').fill('https://example.com/e2e');
    await page.getByRole('button', { name: '↵ Crear proyecto' }).click();

    // Acotado a la tabla: sin esto el nombre matchea también en el toast de
    // "proyecto creado" y Playwright corta por strict mode. Era intermitente —
    // dependía de si el toast ya se había ido cuando corría la aserción.
    await expect(page.locator('[class*="tableRow"]', { hasText: projectName })).toHaveCount(1);

    // ── Visible en el portfolio público ────────────────────────────
    await page.goto('/');
    const publicSection = page.locator('#proyectos');
    await publicSection.scrollIntoViewIfNeeded();
    await expect(publicSection.getByText(projectName)).toBeVisible();

    // ── Eliminar ───────────────────────────────────────────────────
    await page.goto('/admin/projects');
    const row = page.locator('[class*="tableRow"]', { hasText: projectName });
    await row.getByRole('button', { name: 'Eliminar' }).click();
    // Confirmación del diálogo
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    // Sin acotar a la tabla, el nombre matchea también en el diálogo que se está
    // yendo (animación de salida, Fase 2) y en el toast de confirmación, y
    // Playwright corta por strict mode. Lo que importa es que la fila no esté.
    await expect(page.locator('[class*="tableRow"]', { hasText: projectName })).toHaveCount(0);

    // Ya no aparece en el público
    await page.goto('/');
    await expect(page.locator('#proyectos').getByText(projectName)).not.toBeVisible();
  });
});
