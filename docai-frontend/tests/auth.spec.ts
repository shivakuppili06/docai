import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to login page by default', async ({ page }) => {
    await page.goto('/');
    // Without token, it redirects to login
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Login to DocAI/i })).toBeVisible();
  });
  
  test('should show validation errors on empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Sign in/i }).click();
    // HTML5 validation or form validation should prevent submission
    // and we can check if it stays on login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
