import { defineConfig, devices } from '@playwright/test';

/**
 * E2E del portfolio. Requiere el stack corriendo:
 *   docker compose up --build -d   (sirve en http://localhost:8080)
 *
 * Variables:
 *   E2E_BASE_URL    — base del sitio (default http://localhost:8080)
 *   E2E_ADMIN_USER  — usuario admin (habilita los flujos de login/CRUD)
 *   E2E_ADMIN_PASS  — contraseña admin
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
