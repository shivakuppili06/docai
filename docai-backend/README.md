# DocAI Backend — Spring Boot service

Backend for the AI Document Intelligence Platform (RAG-based Q&A).

## Stack
- Spring Boot 3.3 (Web, Security, Data JPA, AMQP, Data Redis, Validation)
- PostgreSQL — users, documents, chat history
- RabbitMQ — async document processing queue (consumed by the Python RAG service)
- Redis — planned caching layer for repeated queries
- JWT (jjwt) — stateless auth

## What's implemented
- `POST /api/auth/register`, `POST /api/auth/login` — JWT issued on success
- `POST /api/documents/upload` (multipart) — stores file, publishes a `document.processing.queue` event
- `GET /api/documents` — list current user's documents
- `POST /api/chat/ask` — proxies question + documentId to the Python RAG microservice (`RAG_SERVICE_URL`, default `http://localhost:8000/query`), stores Q&A + citations
- `GET /api/chat/history/{documentId}` — chat history for a document
- Python FastAPI + LangChain microservice (chunking, Gemini embeddings, ChromaDB, `/query` endpoint)
- RabbitMQ consumer on the Python side to pick up `document.processing.queue` events and update `Document.status`
- React frontend
- Docker Compose wiring all services together

## Not yet implemented (next steps)
- Redis caching of repeated RAG queries

## Run locally
Requires PostgreSQL, RabbitMQ, Redis running (or use Docker Compose from the root directory).

```bash
export DB_USER=postgres DB_PASSWORD=postgres DB_NAME=docai
export JWT_SECRET=$(openssl rand -base64 32)
mvn spring-boot:run
```

## Environment variables
| Var | Default | Purpose |
|---|---|---|
| DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD | localhost/5432/docai/postgres/postgres | PostgreSQL |
| RABBITMQ_HOST / PORT / USER / PASSWORD | localhost/5672/guest/guest | RabbitMQ |
| REDIS_HOST / PORT | localhost/6379 | Redis |
| JWT_SECRET | (insecure default — override in prod) | JWT signing key |
| RAG_SERVICE_URL | http://localhost:8000 | Python RAG microservice base URL |
