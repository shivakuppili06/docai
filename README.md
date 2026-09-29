# DocAI — Monorepo

AI Document Intelligence Platform. Three services, run each from its own folder or using Docker Compose:

```
docai/
├── docai-backend/       Spring Boot (Java) — auth, upload, chat proxy, RBAC
├── docai-rag-service/   FastAPI (Python) — chunking, embeddings, RAG query (multi-doc, SSE streaming)
├── docai-frontend/      React (Vite) — UI (comparison view, SSE chat)
└── docai-mobile/        React Native (Expo) — mobile client
```

## Quick Start (Docker Compose)
You can run the entire stack using Docker Compose. Note: You need a PostgreSQL instance running or you can add it to the `docker-compose.yml`.

```bash
export GEMINI_API_KEY="your-gemini-api-key"
docker-compose up --build
```

## Architecture & Implementation Details

* **Asynchronous Ingestion (RabbitMQ):** Document chunking and embedding (via Gemini) are offloaded to a RabbitMQ queue. This prevents the Spring Boot `/upload` endpoint from blocking or timing out on large PDFs, allowing the UI to remain responsive while the Python worker processes chunks in the background.
* **Resilience & Idempotency:** The Python worker catches ingestion failures and uses an internal callback (`PATCH /api/documents/{id}/status`) to notify the Spring backend if a document failed to parse. Collections in ChromaDB are explicitly cleared before re-ingesting to ensure idempotency across database resets.
* **RAG Tuning:** Documents are processed using a `RecursiveCharacterTextSplitter` with a 1000-character chunk size and 150-character overlap to preserve context boundaries before embedding with `models/gemini-embedding-001`. The top 4 vectors (`k=4`) are retrieved for each query.
* **Role-Based Access Control (RBAC):** Users can share documents with each other by assigning `VIEWER` or `EDITOR` roles. `DocumentController` and `ChatController` verify permissions via the `DocumentShare` entity.
* **Multi-Document Comparison (Upcoming):** Select multiple documents in the UI to query across a concatenated context for cross-document insights.
* **Streaming Chat (Upcoming):** Chat responses are streamed chunk-by-chunk via Server-Sent Events (SSE) from the FastAPI backend through the Spring Boot proxy directly to the React/React Native clients.

This will spin up:
- RabbitMQ and Redis
- `docai-backend` on port 8080
- `docai-rag-api` on port 8000 and `docai-rag-worker`
- `docai-frontend` on port 5173

## Run order (Local Development)
1. Start infra: PostgreSQL, RabbitMQ, Redis (can be spun up via Docker)
2. `cd docai-backend && mvn spring-boot:run` (port 8080)
3. `cd docai-rag-service && uvicorn app.main:app --reload --port 8000` (terminal 1)
4. `cd docai-rag-service && python -m app.worker` (terminal 2 — queue consumer)
5. `cd docai-frontend && npm install && npm run dev` (port 5173)

Each service has its own configuration and setup details.

## Known Limitations & Roadmap
* [x] **Tailwind CSS + shadcn/ui**: Integrated Tailwind and migrated reusable components to use shadcn/ui primitives.
* [x] **TanStack Router**: Replace React Router.
* [x] **Zustand for Chat State**: Implement Zustand store.
* [x] **SSE Streaming Chat**: Server-Sent Events implementation.
* [x] **Analytics Dashboard**: Build out with real data and charts.
* [x] **Fix Document-Sharing Bug**: Fix circular serialization issue in DocumentShare.
* [x] **Redis Caching**: Add caching layer for RAG query results.
* [x] **HLD / LLD Documentation**: Added docs/ARCHITECTURE.md.
* [x] **Rate Limiting**: Protect endpoints from abuse using Redis.
