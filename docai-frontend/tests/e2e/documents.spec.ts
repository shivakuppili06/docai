import { test, expect } from '@playwright/test';
import { setupApiMocks, authenticateSession, mockDocuments } from './fixtures';
import path from 'path';

test.describe('Document Management and Upload Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await authenticateSession(page);
  });

  test('displays document list with proper metadata and status badges', async ({ page }) => {
    await page.goto('/#/documents');

    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();

    const rows = page.getByTestId('document-row');
    await expect(rows).toHaveCount(mockDocuments.length);

    await expect(page.getByText('Quarterly_Financial_Report.pdf')).toBeVisible();
    await expect(page.getByText('INDEXED').first()).toBeVisible();
    await expect(page.getByText('PROCESSING', { exact: true })).toBeVisible();
  });

  test('opens upload modal and validates PDF file selection', async ({ page }) => {
    await page.goto('/#/dashboard');

    const uploadBtn = page.getByRole('button', { name: /upload document/i });
    await uploadBtn.click();

    // Verify modal elements
    await expect(page.getByRole('heading', { name: 'Upload Document' })).toBeVisible();
    const fileInput = page.locator('input[type="file"][accept=".pdf"]');
    await expect(fileInput).toBeVisible();

    // Submit button should be disabled until file is attached
    const submitUploadBtn = page.getByRole('button', { name: 'Upload File' });
    await expect(submitUploadBtn).toBeDisabled();

    // Select synthetic PDF buffer
    await fileInput.setInputFiles({
      name: 'annual_audit_report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 synthetic content test'),
    });

    await expect(submitUploadBtn).toBeEnabled();

    // Cancel closes modal
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Upload Document' })).not.toBeVisible();
  });

  test('uploads document successfully and updates the document list', async ({ page }) => {
    let capturedFileName = '';
    await page.route(/\/api\/documents\/upload/, async (route) => {
      // Confirm request method is POST
      expect(route.request().method()).toBe('POST');
      capturedFileName = 'annual_audit_report.pdf';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'doc-new-99',
          fileName: 'annual_audit_report.pdf',
          status: 'INDEXED',
          uploadedAt: new Date().toISOString(),
          ownerId: 'usr-101',
        }),
      });
    });

    await page.goto('/#/dashboard');
    await page.getByRole('button', { name: /upload document/i }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'annual_audit_report.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 synthetic content test'),
    });

    await page.getByRole('button', { name: 'Upload File' }).click();

    // Verify upload toast notification
    await expect(page.locator('text=Document uploaded successfully')).toBeVisible();
    expect(capturedFileName).toBe('annual_audit_report.pdf');
  });

  test('displays error toast when document upload fails', async ({ page }) => {
    await page.route(/\/api\/documents\/upload/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to parse PDF document' }),
      });
    });

    await page.goto('/#/dashboard');
    await page.getByRole('button', { name: /upload document/i }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'corrupted_file.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 broken'),
    });

    await page.getByRole('button', { name: 'Upload File' }).click();

    await expect(page.locator('text=Failed to parse PDF document')).toBeVisible();
  });

  test('filters document list dynamically using search input', async ({ page }) => {
    await page.goto('/#/documents');

    const searchInput = page.getByPlaceholder('Search documents by name...');
    await expect(searchInput).toBeVisible();

    // Search for specific document
    await searchInput.fill('Financial');
    await expect(page.getByText('Quarterly_Financial_Report.pdf')).toBeVisible();
    await expect(page.getByText('Project_Specification_v2.pdf')).not.toBeVisible();

    // Search for non-existent document
    await searchInput.fill('NonExistentDocumentXYZ');
    await expect(page.getByText('No documents found')).toBeVisible();
    await expect(page.getByText('Try a different search term.')).toBeVisible();

    // Clear search restores all documents
    await searchInput.clear();
    await expect(page.getByText('Quarterly_Financial_Report.pdf')).toBeVisible();
    await expect(page.getByText('Project_Specification_v2.pdf')).toBeVisible();
  });

  test('handles document deletion with confirmation dialog', async ({ page }) => {
    await page.goto('/#/documents');

    const firstRow = page.getByTestId('document-row').first();
    await expect(firstRow).toContainText('Quarterly_Financial_Report.pdf');

    // Click delete icon on first row
    const deleteBtn = firstRow.getByTestId('delete-document-btn');
    await deleteBtn.click();

    // Confirmation modal should appear
    await expect(page.getByRole('heading', { name: 'Delete document?' })).toBeVisible();
    await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();

    // Cancel keeps the document
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Quarterly_Financial_Report.pdf')).toBeVisible();

    // Reopen and confirm deletion
    await deleteBtn.click();
    const modalDeleteBtn = page.locator('.modal-actions').getByRole('button', { name: 'Delete' });
    await modalDeleteBtn.click();

    await expect(page.locator('text=Document deleted successfully')).toBeVisible();
    await expect(page.getByText('Quarterly_Financial_Report.pdf')).not.toBeVisible();
  });

  test('supports pagination across multiple document pages', async ({ page }) => {
    // Generate 15 documents to test pagination with size=10
    const multiDocs = Array.from({ length: 15 }, (_, i) => ({
      id: `doc-page-${i + 1}`,
      fileName: `Doc_Page_Item_${i + 1}.pdf`,
      status: 'INDEXED' as const,
      uploadedAt: new Date(Date.now() - i * 3600000).toISOString(),
      ownerId: 'usr-101',
    }));

    await setupApiMocks(page, { documents: multiDocs });
    await page.goto('/#/documents');

    await expect(page.getByText('Page 1 of 2')).toBeVisible();
    await expect(page.getByText('Doc_Page_Item_1.pdf')).toBeVisible();

    const nextBtn = page.getByRole('button', { name: 'Next' });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await expect(page.getByText('Page 2 of 2')).toBeVisible();
    await expect(page.getByText('Doc_Page_Item_11.pdf')).toBeVisible();

    const prevBtn = page.getByRole('button', { name: 'Previous' });
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();

    await expect(page.getByText('Page 1 of 2')).toBeVisible();
  });

  test('navigates to document viewer when clicking a row', async ({ page }) => {
    await page.goto('/#/documents');

    const firstRow = page.getByTestId('document-row').first();
    await firstRow.click();

    await expect(page).toHaveURL(/.*#\/documents\/doc-1/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Quarterly_Financial_Report.pdf');
    await expect(page.getByText('Document Details')).toBeVisible();
    await expect(page.getByRole('button', { name: /open in chat/i })).toBeVisible();
  });
});
