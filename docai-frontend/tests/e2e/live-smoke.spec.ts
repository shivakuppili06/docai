import { test, expect } from '@playwright/test';

/**
 * End-to-End Browser-Level Live Smoke Test
 * 
 * Executes real browser interactions against the LIVE running application stack
 * without mocking API requests or backend responses.
 */
test.describe.serial('Live Application Smoke Test (Unmocked)', () => {
  const timestamp = Date.now();
  const testUser = {
    email: `smoke.user.${timestamp}@example.com`,
    password: 'Password123!',
    fullName: `Smoke Tester ${timestamp}`,
  };

  test('1. Landing page loads correctly with all key sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify title and brand
    await expect(page).toHaveTitle(/DocAI/i);
    await expect(page.locator('.landing-brand-text').first()).toContainText('DocAI');

    // Verify hero section elements
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Login/i }).first()).toBeVisible();

    // Verify key landing sections exist
    await expect(page.locator('#features')).toBeAttached();
    await expect(page.locator('#how-it-works')).toBeAttached();
  });

  test('2. Live user registration, authenticated session, and dashboard verification', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/#/register');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();

    // Fill registration form using accessible label locators
    await page.getByLabel('Full Name').fill(testUser.fullName);
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password', { exact: true }).fill(testUser.password);
    await page.getByLabel('Confirm Password').fill(testUser.password);

    // Submit live registration
    await page.getByRole('button', { name: /Sign Up/i }).click();

    // Wait for redirect to dashboard upon successful live registration
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);

    // Verify dashboard displays authenticated state
    await expect(page.getByText(/Total Documents|Uploaded Documents/i).first()).toBeVisible({ timeout: 10000 });
    
    // Verify token exists in localStorage under docai_token
    const token = await page.evaluate(() => localStorage.getItem('docai_token'));
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('3. Live user login and authenticated navigation across core views', async ({ page }) => {
    // Clear session to test clean login
    await page.goto('/#/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();

    // Fill login credentials
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);

    // Submit login
    await page.getByRole('button', { name: /Sign In/i }).click();

    // Confirm navigation to dashboard
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText('Total Documents')).toBeVisible({ timeout: 10000 });

    // 1. Navigate to Documents view
    await page.goto('/#/documents');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Documents/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/Search documents/i)).toBeVisible({ timeout: 10000 });

    // 2. Navigate to Analytics view
    await page.goto('/#/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Workspace Overview/i })).toBeVisible({ timeout: 10000 });

    // 3. Navigate to Settings view
    await page.goto('/#/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible({ timeout: 10000 });

    // 4. Test Sign Out
    await page.getByRole('button', { name: /Sign Out/i }).click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    const clearedToken = await page.evaluate(() => localStorage.getItem('docai_token'));
    expect(clearedToken).toBeNull();
  });
});
