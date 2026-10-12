import { test, expect } from '@playwright/test';
import { setupApiMocks, authenticateSession } from './fixtures';

test.describe('Analytics and Lazy Loading Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await authenticateSession(page);
  });

  test('analytics route is accessible and displays accurate status metrics', async ({ page }) => {
    await page.goto('/#/analytics');

    await expect(page.getByRole('heading', { name: 'Workspace Overview' })).toBeVisible();

    // Verify statistical summary cards
    await expect(page.locator('.stat-label:has-text("Total Documents")')).toBeVisible();
    await expect(page.locator('.stat-value:has-text("4")')).toBeVisible();

    await expect(page.locator('.stat-label:has-text("Indexed Successfully")')).toBeVisible();
    await expect(page.locator('.stat-value:has-text("2")')).toBeVisible();

    await expect(page.locator('.stat-label:has-text("Failed Indexing")')).toBeVisible();
    await expect(page.locator('.stat-value:has-text("1")')).toBeVisible();
  });

  test('renders status distribution and usage charts', async ({ page }) => {
    await page.goto('/#/analytics');

    await expect(page.getByRole('heading', { name: 'Document Status Breakdown' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'System Usage' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Distribution' })).toBeVisible();

    // Verify SVG chart elements rendered by Recharts
    const chartContainers = page.locator('.recharts-responsive-container');
    await expect(chartContainers.first()).toBeVisible();
  });

  test('handles zero data state gracefully', async ({ page }) => {
    await setupApiMocks(page, { documents: [] });
    await page.goto('/#/analytics');

    await expect(page.getByRole('heading', { name: 'Workspace Overview' })).toBeVisible();
    await expect(page.locator('.stat-value:has-text("0")').first()).toBeVisible();

    // Verify empty trend state message
    await expect(page.getByText('No trending data available')).toBeVisible();
    await expect(page.getByText('Upload some documents to see upload trends over time.')).toBeVisible();
  });

  test('displays error toast when analytics data fetching fails', async ({ page }) => {
    await page.route(/\/api\/documents/, async (route) => {
      await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) });
    });

    await page.goto('/#/analytics');
    await expect(page.locator('text=Failed to load analytics')).toBeVisible();
  });

  test('defers chart library bundle and does not load it on the landing page', async ({ page }) => {
    const downloadedChunks: string[] = [];
    page.on('request', (req) => {
      downloadedChunks.push(req.url());
    });

    // 1. Visit Landing Page unauthenticated
    await page.goto('/#/');
    await expect(page.locator('.landing-brand-text').first()).toContainText('DocAI');

    // Chart vendor bundle should not be requested on landing page
    const chartBundleLoadedOnLanding = downloadedChunks.some((url) =>
      url.includes('vendor-charts')
    );
    expect(chartBundleLoadedOnLanding).toBe(false);

    // 2. Navigate to Analytics page as authenticated user
    await authenticateSession(page);
    await page.goto('/#/analytics');
    await expect(page.getByRole('heading', { name: 'Workspace Overview' })).toBeVisible();

    // When built for production, vendor-charts chunk is requested
    // In dev mode, Recharts dependencies are loaded upon visiting the route
    const analyticsChartDependenciesLoaded = downloadedChunks.some(
      (url) => url.includes('recharts') || url.includes('vendor-charts')
    );
    expect(analyticsChartDependenciesLoaded).toBe(true);
  });
});
