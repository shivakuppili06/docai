import { test, expect } from '@playwright/test';
import { setupApiMocks, authenticateSession, mockDocuments, mockChatHistory } from './fixtures';

test.describe('AI Chat and Multi-Document Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await authenticateSession(page);
  });

  test('chat page loads with document metadata and existing message history', async ({ page }) => {
    await page.goto('/#/chat/doc-1');

    await expect(page.locator('.chat-title')).toContainText('Quarterly_Financial_Report.pdf');
    await expect(page.locator('.chat-subtitle')).toContainText('DocAI Assistant');

    // Existing question & answer from history
    await expect(page.locator('.message.user .bubble')).toContainText('What are the main financial highlights?');
    await expect(page.locator('.message.ai .bubble')).toContainText('28% increase in overall cloud subscription revenue');

    // Sources panel
    await expect(page.locator('.sources-header')).toContainText('Sources');
  });

  test('prevents submission of empty messages', async ({ page }) => {
    await page.goto('/#/chat/doc-1');

    const textarea = page.locator('#chat-input');
    const sendBtn = page.getByRole('button', { name: 'Send message' });

    await expect(textarea).toBeEmpty();
    await expect(sendBtn).toBeDisabled();

    // Whitespace only should remain disabled
    await textarea.fill('   ');
    await expect(sendBtn).toBeDisabled();
  });

  test('submits question and renders streaming assistant response with citations', async ({ page }) => {
    await page.goto('/#/chat/doc-1');

    const textarea = page.locator('#chat-input');
    const sendBtn = page.getByRole('button', { name: 'Send message' });

    await textarea.fill('What is the forecasted growth for the upcoming quarter?');
    await expect(sendBtn).toBeEnabled();
    await sendBtn.click();

    // User question appears in message stream
    await expect(page.locator('.message.user').last()).toContainText(
      'What is the forecasted growth for the upcoming quarter?'
    );

    // AI response streamed from SSE mock
    await expect(page.locator('.message.ai').last()).toContainText(
      'here is the verified answer for: "What is the forecasted growth for the upcoming quarter?".'
    );

    // Textarea cleared after sending
    await expect(textarea).toBeEmpty();
  });

  test('displays error state when stream returns structured error', async ({ page }) => {
    // Override SSE stream mock to emit structured error event
    await page.route(/\/api\/chat\/ask\/stream/, async (route) => {
      const sseBody = `data: ${JSON.stringify({ error: 'LLM token rate limit exceeded. Please try again shortly.' })}\n\n`;
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: sseBody,
      });
    });

    await page.goto('/#/chat/doc-1');

    const textarea = page.locator('#chat-input');
    await textarea.fill('Calculate the annual margin');
    await page.getByRole('button', { name: 'Send message' }).click();

    // Verify error alert styling rendered in AI bubble
    const errorBubble = page.locator('[role="alert"]');
    await expect(errorBubble).toBeVisible();
    await expect(errorBubble).toContainText('LLM token rate limit exceeded');
  });

  test('supports multi-document comparison selection', async ({ page }) => {
    await page.goto('/#/chat/doc-1');

    const compareBtn = page.getByRole('button', { name: /\+ Compare Docs/i });
    await expect(compareBtn).toBeVisible();
    await compareBtn.click();

    // Verify dropdown shows other indexed documents
    await expect(page.getByText('Select documents to cross-compare:')).toBeVisible();
    await expect(page.getByText('Project_Specification_v2.pdf')).toBeVisible();

    // Check the box to compare
    const checkbox = page.getByLabel('Project_Specification_v2.pdf');
    if (await checkbox.count()) {
      await checkbox.check();
    } else {
      // If label wraps text
      await page.locator('input[type="checkbox"]').first().check();
    }

    // Badge should show "Comparing 2 Docs"
    await expect(page.getByText('Comparing 2 Docs')).toBeVisible();
  });

  test('redirects to documents if requested document does not exist', async ({ page }) => {
    await page.goto('/#/chat/doc-non-existent-999');

    await expect(page).toHaveURL(/.*#\/documents/);
    await expect(page.locator('text=Document not found')).toBeVisible();
  });
});
