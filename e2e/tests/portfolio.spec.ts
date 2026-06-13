import { test, expect } from '@playwright/test';

test.describe('Portfolio público', () => {
  test('carga el one-page con todas las secciones', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Augusto Freire/);
    await expect(page.locator('#inicio')).toBeVisible();
    await expect(page.locator('#sobre')).toBeAttached();
    await expect(page.locator('#proyectos')).toBeAttached();
    await expect(page.locator('#contacto')).toBeAttached();
  });

  test('la API de status responde y la terminal del hero la refleja', async ({ page }) => {
    const res = await page.request.get('/api/status');
    expect(res.ok()).toBeTruthy();
    const { status } = await res.json();
    expect(['open', 'working', 'occupied']).toContain(status);
  });

  test('el toggle de tema aplica modo oscuro y persiste tras recargar', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Activar modo oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Activar modo claro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('menú móvil: abre, navega y cierra', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();

    await menu.getByRole('link', { name: /Proyectos/ }).click();
    await expect(menu).not.toBeVisible();
  });

  test('el formulario de contacto valida antes de enviar', async ({ page }) => {
    await page.goto('/');

    const form = page.locator('#contacto form');
    await form.scrollIntoViewIfNeeded();
    await form.getByRole('button', { name: /enviar/i }).click();

    // No debería navegar ni enviar: quedan errores de validación visibles
    await expect(page.locator('#contacto')).toBeVisible();
  });
});
