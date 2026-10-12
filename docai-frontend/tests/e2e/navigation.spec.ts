import { test, expect } from '@playwright/test';
import { setupApiMocks, authenticateSession } from './fixtures';

test.describe('Navigation and Protected Routes', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('unauthenticated users are redirected from every protected route', async ({ page }) => {
    const protectedRoutes = ['/#/dashboard', '/#/documents', '/#/analytics', '/#/settings'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*#\/login/);
    }
  });

  test('authenticated users can navigate seamlessly across all sidebar routes', async ({ page }) => {
    await authenticateSession(page);
    await page.goto('/#/dashboard');

    // 1. Navigate to Documents via sidebar
    await page.getByRole('link', { name: 'Documents' }).click();
    await expect(page).toHaveURL(/.*#\/documents/);
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();

    // 2. Navigate to Analytics via sidebar
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/.*#\/analytics/);
    await expect(page.getByRole('heading', { name: 'Workspace Overview' })).toBeVisible();

    // 3. Navigate to Settings via sidebar
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/.*#\/settings/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // 4. Return to Dashboard via sidebar
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*#\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('displays 404 Not Found page for invalid routes', async ({ page }) => {
    await page.goto('/#/non-existent-page-xyz');

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();

    const returnLink = page.getByRole('link', { name: 'Return to Dashboard' });
    await expect(returnLink).toBeVisible();
  });

  test('direct hash deep-linking and browser reload work without redirect loops', async ({ page }) => {
    await authenticateSession(page);

    await page.goto('/#/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Reload page
    await page.reload();
    await expect(page).toHaveURL(/.*#\/settings/);
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('normalizes direct path navigation to hash routes', async ({ page }) => {
    // App.tsx contains path normalizer for legacy/direct URL access
    await page.goto('/login');
    await expect(page).toHaveURL(/.*#\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });
});
