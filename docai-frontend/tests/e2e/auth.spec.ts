import { test, expect } from '@playwright/test';
import { setupApiMocks, authenticateSession, mockUser } from './fixtures';

test.describe('Authentication and Session Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
  });

  test('landing page loads correctly with brand and navigation CTAs', async ({ page }) => {
    await page.goto('/#/');
    await expect(page.locator('.landing-brand-text').first()).toContainText('DocAI');
    await expect(page.getByRole('link', { name: /login/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('login form is visible and validates required inputs', async ({ page }) => {
    await page.goto('/#/login');
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password', { exact: true });
    const signInBtn = page.getByRole('button', { name: /sign in/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInBtn).toBeVisible();

    // Verify HTML5 required attributes prevent empty submission
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');
  });

  test('invalid credentials display an error message', async ({ page }) => {
    await setupApiMocks(page, { loginSuccess: false });
    await page.goto('/#/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
    await page.getByRole('button', { name: /sign in/i }).click();

    const errorAlert = page.locator('.card').getByText('Invalid email or password');
    await expect(errorAlert).toBeVisible();
    expect(page.url()).toContain('#/login');
  });

  test('successful login redirects to dashboard and sets session', async ({ page }) => {
    await setupApiMocks(page, { loginSuccess: true });
    await page.goto('/#/login');

    await page.getByLabel('Email').fill(mockUser.email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/.*#\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Verify localStorage has been populated
    const token = await page.evaluate(() => localStorage.getItem('docai_token'));
    expect(token).toBeTruthy();
  });

  test('unauthenticated users are redirected from protected routes to login', async ({ page }) => {
    await page.goto('/#/dashboard');
    await expect(page).toHaveURL(/.*#\/login/);

    await page.goto('/#/documents');
    await expect(page).toHaveURL(/.*#\/login/);

    await page.goto('/#/analytics');
    await expect(page).toHaveURL(/.*#\/login/);
  });

  test('authenticated users can access protected routes and see user profile', async ({ page }) => {
    await authenticateSession(page);
    await page.goto('/#/dashboard');

    await expect(page).toHaveURL(/.*#\/dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(mockUser.fullName)).toBeVisible();
  });

  test('logout clears the session and redirects to login', async ({ page }) => {
    await authenticateSession(page);
    await page.goto('/#/dashboard');

    const logoutBtn = page.getByTestId('logout-button');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await expect(page).toHaveURL(/.*#\/login/);

    // Verify token removed
    const token = await page.evaluate(() => localStorage.getItem('docai_token'));
    expect(token).toBeNull();
  });

  test('expired authentication (401 response) clears session and redirects', async ({ page }) => {
    // Route documents API to return 401 session expired
    await page.route(/\/api\/documents(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Session expired' }),
      });
    });

    // Perform login to enter dashboard
    await page.goto('/#/login');
    await page.getByLabel('Email').fill(mockUser.email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Protected dashboard queries /api/documents, receives 401, clears session, and redirects to login
    await expect(page).toHaveURL(/.*#\/login/);
    const token = await page.evaluate(() => localStorage.getItem('docai_token'));
    expect(token).toBeNull();
  });

  test('registration form validates password matching and handles API errors', async ({ page }) => {
    await page.goto('/#/register');

    // Test mismatched passwords
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('newuser@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Password123');
    await page.getByLabel('Confirm Password').fill('Mismatch999');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.locator('text=Passwords do not match')).toBeVisible();

    // Test API error on duplicate email
    await setupApiMocks(page, { registerSuccess: false });
    await page.getByLabel('Confirm Password').fill('Password123');
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.locator('.card').getByText('Email already exists')).toBeVisible();

    // Test successful registration
    await setupApiMocks(page, { registerSuccess: true });
    await page.getByRole('button', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/.*#\/dashboard/);
  });
});
