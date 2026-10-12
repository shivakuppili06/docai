import { test as base, Page, Route } from '@playwright/test';
import { Document, PaginatedResponse, User } from '../../src/types';
import { AskResponse } from '../../src/api/client';

export const mockUser: User = {
  id: 'usr-101',
  email: 'qa.engineer@example.com',
  fullName: 'Alex Automation',
};

export const mockAuthToken = 'mock-jwt-token-xyz123';

export const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    fileName: 'Quarterly_Financial_Report.pdf',
    status: 'INDEXED',
    uploadedAt: '2026-10-10T10:00:00Z',
    ownerId: 'usr-101',
  },
  {
    id: 'doc-2',
    fileName: 'Project_Specification_v2.pdf',
    status: 'INDEXED',
    uploadedAt: '2026-10-11T14:30:00Z',
    ownerId: 'usr-101',
  },
  {
    id: 'doc-3',
    fileName: 'Pending_Processing_Doc.pdf',
    status: 'PROCESSING',
    uploadedAt: '2026-10-12T09:15:00Z',
    ownerId: 'usr-101',
  },
  {
    id: 'doc-4',
    fileName: 'Failed_Corrupt_File.pdf',
    status: 'FAILED',
    uploadedAt: '2026-10-09T08:00:00Z',
    ownerId: 'usr-101',
  },
];

export const mockChatHistory: AskResponse[] = [
  {
    id: 'msg-1',
    question: 'What are the main financial highlights?',
    answer: 'The company reported a 28% increase in overall cloud subscription revenue for Q3.',
    sourceCitations: JSON.stringify([
      {
        chunk_index: 1,
        text_snippet: 'Cloud subscription revenue increased by 28% compared to Q2 figures.',
        document_id: 'doc-1',
      },
    ]),
  },
];

export interface MockApiOptions {
  documents?: Document[];
  chatHistory?: AskResponse[];
  loginSuccess?: boolean;
  registerSuccess?: boolean;
  uploadSuccess?: boolean;
  pdfUrl?: string;
}

/**
 * Configure deterministic API route mocks for DocAI frontend endpoints.
 * Handles both relative and absolute backend URL patterns (/api/**).
 */
export async function setupApiMocks(page: Page, options: MockApiOptions = {}) {
  const docs = options.documents !== undefined ? [...options.documents] : [...mockDocuments];
  const history = options.chatHistory !== undefined ? [...options.chatHistory] : [...mockChatHistory];

  // Mock /api/auth/login
  await page.route(/\/api\/auth\/login/, async (route) => {
    if (options.loginSuccess === false) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      });
      return;
    }
    const req = route.request();
    const postData = req.postDataJSON() || {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: mockAuthToken,
        email: postData.email || mockUser.email,
        fullName: mockUser.fullName,
        id: mockUser.id,
      }),
    });
  });

  // Mock /api/auth/register
  await page.route(/\/api\/auth\/register/, async (route) => {
    if (options.registerSuccess === false) {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email already exists' }),
      });
      return;
    }
    const req = route.request();
    const postData = req.postDataJSON() || {};
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: mockAuthToken,
        email: postData.email || mockUser.email,
        fullName: postData.fullName || mockUser.fullName,
        id: mockUser.id,
      }),
    });
  });

  // Mock /api/documents/upload
  await page.route(/\/api\/documents\/upload/, async (route) => {
    if (options.uploadSuccess === false) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to parse PDF document' }),
      });
      return;
    }

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      fileName: 'Uploaded_Test_Document.pdf',
      status: 'INDEXED',
      uploadedAt: new Date().toISOString(),
      ownerId: mockUser.id,
    };
    docs.unshift(newDoc);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(newDoc),
    });
  });

  // Mock /api/documents/:id/url
  await page.route(/\/api\/documents\/[^/]+\/url/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        url: options.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      }),
    });
  });

  // Mock /api/documents/:id (DELETE & GET)
  await page.route(/\/api\/documents\/([^/?]+)$/, async (route) => {
    const method = route.request().method();
    const url = route.request().url();
    const docId = url.split('/').pop()?.split('?')[0];

    if (method === 'DELETE') {
      const idx = docs.findIndex((d) => d.id === docId);
      if (idx !== -1) {
        docs.splice(idx, 1);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (method === 'GET') {
      const found = docs.find((d) => d.id === docId);
      if (found) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(found),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Document not found' }),
        });
      }
      return;
    }

    await route.continue();
  });

  // Mock /api/documents (paginated list)
  await page.route(/\/api\/documents(\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const pageNum = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    const start = pageNum * size;
    const paginatedItems = docs.slice(start, start + size);
    const totalPages = Math.max(1, Math.ceil(docs.length / size));

    const response: PaginatedResponse<Document> = {
      content: paginatedItems,
      pageable: {
        pageNumber: pageNum,
        pageSize: size,
      },
      totalElements: docs.length,
      totalPages,
      last: pageNum >= totalPages - 1,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });

  // Mock /api/chat/history/:id
  await page.route(/\/api\/chat\/history\/[^/]+/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(history),
    });
  });

  // Mock /api/chat/ask/stream (Server-Sent Events)
  await page.route(/\/api\/chat\/ask\/stream/, async (route) => {
    const req = route.request();
    const body = req.postDataJSON() || {};
    const question = body.question || 'Test question';

    // Build SSE chunks matching client.ts protocol
    const sseBody = [
      `data: ${JSON.stringify({ text: `According to ${docs[0]?.fileName || 'the document'}, ` })}\n\n`,
      `data: ${JSON.stringify({ text: `here is the verified answer for: "${question}".` })}\n\n`,
      `data: ${JSON.stringify({
        sources: [
          {
            chunk_index: 1,
            text_snippet: 'Verified text snippet from document chunk 1.',
            document_id: body.documentId || 'doc-1',
          },
        ],
      })}\n\n`,
    ].join('');

    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      body: sseBody,
    });
  });
}

/**
 * Injects authenticated session in browser before navigating to application routes.
 */
export async function authenticateSession(page: Page, user = mockUser, token = mockAuthToken) {
  await page.addInitScript(
    ({ t, u }) => {
      window.localStorage.setItem('docai_token', t);
      window.localStorage.setItem('docai_email', u.email);
      window.localStorage.setItem('docai_fullName', u.fullName);
    },
    { t: token, u: user }
  );
}
