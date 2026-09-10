# DocAI RAG Service — Python (FastAPI + LangChain)

Handles document ingestion (chunking + embedding) and RAG query answering
for the AI Document Intelligence Platform. Consumes upload events from the
Spring Boot backend via RabbitMQ.

## Stack
- FastAPI — `/query`, `/ingest`, `/health`
- LangChain + `langchain-google-genai` — chunking, Gemini embeddings, Gemini chat
- ChromaDB (local persistent) — one collection per document
- `pika` — RabbitMQ consumer (`app/worker.py`)
- `httpx` — reports ingestion status back to Spring Boot

## Setup
```bash
python3 -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in GEMINI_API_KEY
```

## Run

Two processes run side by side:

**1. API server** (serves `/query` for the Spring backend to call):
```bash
uvicorn app.main:app --reload --port 8000
```

**2. Queue worker** (consumes upload events, ingests documents):
```bash
python -m app.worker
```

Requires RabbitMQ running (see Spring Boot backend's README/Docker Compose).

## Endpoints
- `POST /ingest` — manual ingestion trigger, useful for testing without the queue:
  ```json
  {"document_id": 1, "storage_path": "/path/to/file.pdf"}
  ```
- `POST /query` — called by Spring Boot's `RagQueryService`:
  ```json
  {"document_id": 1, "question": "What is this document about?"}
  ```
- `GET /health`

## How ingestion flows end-to-end
1. User uploads a file via the React frontend → Spring Boot `/api/documents/upload`
2. Spring Boot saves the file, publishes a `DocumentProcessingEvent` to RabbitMQ
3. `app/worker.py` consumes the event, extracts text, chunks it, embeds via Gemini, stores in ChromaDB
4. Worker calls back `PATCH /api/documents/{id}/status` on Spring Boot to mark `INDEXED` or `FAILED`
5. User asks a question → Spring Boot `/api/chat/ask` → this service's `/query` → retrieves top-k chunks, asks Gemini, returns grounded answer + citations

## Notes / things to harden before "real" deployment
- The `/api/documents/{id}/status` callback on the Spring side is currently `permitAll()` for simplicity — add a shared-secret header or internal network restriction before deploying publicly.
- ChromaDB here is local-disk persistent storage — fine for a portfolio deploy; for real scale you'd swap to a hosted vector DB (Pinecone, Chroma Cloud, pgvector).
- No retry/dead-letter handling on the queue consumer yet — add if you want to demonstrate resilience patterns.
