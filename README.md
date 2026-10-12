# DocAI — Intelligent Document Q&A Platform

DocAI is a full-stack, distributed AI-powered document intelligence and question-answering platform. It enables users to upload PDF documents, asynchronously ingest and index embeddings, interact via streaming real-time chat with citations, run cross-document comparative analysis, and share documents with role-based access control (RBAC).

---

## 1. System Architecture & Responsibilities

```
                      ┌───────────────────────────────────────┐
                      │    DocAI Frontend (React 18 / Vite)   │
                      │  - TanStack Router, Zustand, Axios    │
                      │  - Nginx SPA Container (Port 5173/80) │
                      └──────────────────┬────────────────────┘
                                         │ REST & SSE
                                         ▼
                      ┌───────────────────────────────────────┐
                      │    DocAI Backend (Spring Boot 3)      │
                      │  - Port 8080                          │
                      │  - Auth (JWT HS256), User & Doc CRUD  │
                      │  - RBAC & Sharing (VIEWER / EDITOR)   │
                      │  - Distributed Rate Limiter (Redis)   │
                      │  - Ingestion Producer (RabbitMQ)      │
                      └───────┬──────────┬──────────┬─────────┘
                              │          │          │
                     Metadata │          │ S3 URLs  │ Service-to-Service
                     & Shares │          │ Uploads  │ (X-Service-Token)
                              ▼          ▼          ▼
┌──────────────────┐  ┌────────────┐ ┌─────────┐ ┌───────────────────────────┐
│ PostgreSQL/Neon  │  │  AWS S3 /  │ │ RabbitMQ│ │ DocAI RAG Service (FastAPI)│
│ Relational Store │  │ Local Disk │ │ Message │ │ - Port 8000 (API & Stream)│
└──────────────────┘  └────────────┘ │  Broker │ │ - ChromaDB Vector Store   │
                                     └────┬────┘ │ - Gemini Embeddings & LLM │
                                          │      │ - Ingestion Worker Daemon │
                                          └─────►└───────────────────────────┘
```

### Component Breakdown
- **`docai-frontend` (Port 5173 / Container 80):** Single Page Application built with React 18, Vite, TypeScript, TanStack Router (hash/path normalizer), Tailwind CSS, Lucide icons, Chart.js/react-chartjs-2 (lazy-loaded), and Vitest + Playwright. Served via multi-stage Nginx with security headers and SPA fallback.
- **`docai-backend` (Port 8080):** Spring Boot 3.3.4 (Java 17/21) service handling user registration, authentication (JWT), metadata storage, document access validation, rate limiting, and S3 file coordination.
- **`docai-rag-service` (Port 8000 & Worker):** Python 3.11/FastAPI service utilizing LangChain, ChromaDB, and Google Gemini (`models/gemini-embedding-001` & `gemini-1.5-flash`). Handles chunking, vector indexing, single & multi-document RAG queries, and SSE streaming with citation attribution.
- **Infrastructure:** PostgreSQL (Relational metadata), Redis 7 (distributed rate limiting & query caching), RabbitMQ 3.12 (asynchronous document processing queue), and AWS S3 (binary PDF document storage).

---

## 2. Local Setup & Environment Variables

### Prerequisites
- Node.js 20+ & npm
- Java JDK 17 or 21 & Maven 3.9+
- Python 3.11+
- Docker & Docker Compose (optional for full containerized stack)

### Environment Configuration
Each service provides a sanitized `.env.example`. Create corresponding `.env` files:

#### Root / Docker Compose `.env`
```bash
# Database & Broker
DB_PASSWORD=your_secure_db_password
RABBITMQ_PASSWORD=your_secure_rabbitmq_password

# Authentication & Internal Security
JWT_SECRET=your_super_secret_jwt_key_32_bytes_min_length!!
SERVICE_API_KEY=your_internal_service_token_min_32_chars!

# External AI & Cloud
GEMINI_API_KEY=your_google_gemini_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-docai-bucket-name
```

#### Frontend `docai-frontend/.env`
```bash
VITE_API_BASE_URL=http://localhost:8080
```

---

## 3. Running Locally

### Option A: Docker Compose (All Services)
```bash
docker-compose up --build
```
Access points:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- RAG Service: `http://localhost:8000`
- RabbitMQ Management: `http://localhost:15672` (guest / guest)

### Option B: Local Development Run Order
1. **Infrastructure:** Start PostgreSQL (5432), Redis (6379), and RabbitMQ (5672).
2. **Spring Boot Backend:**
   ```bash
   cd docai-backend
   mvn spring-boot:run
   ```
3. **RAG Service API & Worker (Two Terminals):**
   ```bash
   cd docai-rag-service
   # Terminal 1: FastAPI API
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   # Terminal 2: RabbitMQ Worker
   python -m app.worker
   ```
4. **React Frontend:**
   ```bash
   cd docai-frontend
   npm install
   npm run dev
   ```

---

## 4. Test Suites & Local Verification Commands

### Frontend Verification
```bash
cd docai-frontend

# 1. TypeScript Strict Type-Check (0 errors)
npx tsc --noEmit

# 2. Vitest Unit Tests (3 passed)
npm test

# 3. Production Bundle Build (built with vendor chunk splitting)
npm run build

# 4. Playwright End-to-End Test Suite (33 passed across 5 spec files)
npm run test:e2e
```

### Backend Spring Boot Verification
```bash
cd docai-backend

# Runs 23 tests (AuthControllerTest, DocumentControllerTest, ChatControllerTest, AuthServiceTest, DocumentServiceTest)
mvn test
```

### Python RAG Service Verification
```bash
cd docai-rag-service

# Runs 10 test cases covering health, query authorization, rate limiting, and multi-doc query
pytest -v
```

---

## 5. CI/CD Pipeline (GitHub Actions)

The workflow is defined in `.github/workflows/ci.yml`. It runs automatically on pull requests and pushes to `main`/`master` across 3 parallel isolated jobs:

1. **`frontend-ci`:**
   - Sets up Node.js 20 with `npm` caching.
   - Executes `npm ci`, `npx tsc --noEmit`, `npm test` (Vitest), and `npm run build`.
   - Provisions headless Chromium and runs all 33 Playwright E2E tests.
   - Uploads HTML test reports and trace artifacts automatically.
2. **`backend-ci`:**
   - Sets up Eclipse Temurin Java 21 with Maven caching.
   - Executes `mvn clean test --batch-mode` using safe ephemeral CI test credentials without requiring production secrets.
3. **`rag-ci`:**
   - Sets up Python 3.11 with pip caching.
   - Installs dependencies from `requirements.txt`.
   - Runs `pytest -v` across API and RAG pipeline unit tests.

---

## 6. Security Audit Findings & Remediation

| Severity | Category | Vulnerability / Issue | Remediation Status |
|:---|:---|:---|:---|
| **High** | Authorization | Unenforced document access validation in multi-doc comparisons | **Remediated**: `ChatController` and `DocumentService` enforce `findAccessibleByIdAndUserId()` across every queried document ID, preventing cross-tenant access. |
| **High** | Insecure Storage | Untracked secrets in git repositories | **Remediated**: `.gitignore` strictly blocks all `.env` files. Sanitized `.env.example` templates committed. |
| **Medium** | Service-to-Service | Unauthenticated internal endpoints for document status patching | **Remediated**: Protected via `ServiceAuthFilter` and `verify_service_token` requiring valid `X-Service-Token`. |
| **Medium** | File Uploads | Malicious MIME types, executable files, or path traversal attacks | **Remediated**: Validates PDF magic bytes (`%PDF`), whitelists file types, sanitizes file names (`contains("..")` checks), and prefixes random UUID keys. |
| **Medium** | Container Security | Running containers as root | **Remediated**: Multi-stage Dockerfiles configured with non-root system users (`docai`) across backend, RAG, and frontend. |
| **Low** | HTTP Headers | Missing clickjacking, sniffing, and cache headers on frontend | **Remediated**: `nginx.conf` sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and cache immutable static assets. |

---

## 7. Production Deployment Strategy & Zero-Cost Tier Options

### Architecture Recommendation (Cost-Optimized / Free Tier)
- **Frontend:** Cloudflare Pages or Vercel (Free tier: unlimited static bandwidth, custom domains, automated SSL/TLS, and instant global CDN edge caching).
- **Backend & RAG API:** Render or Railway (Free / Starter tier: container deployment from GitHub, health check integration, auto-restart).
- **PostgreSQL Database:** Neon Serverless Postgres (Free tier: 0.5 GB storage, autoscaling, connection pooling).
- **Redis Cache & Rate Limiting:** Upstash Redis (Free tier: 10,000 commands/day, serverless connection over REST/Redis protocol).
- **Object Storage:** AWS S3 Free Tier (5 GB standard storage for 12 months) or Cloudflare R2 (10 GB free storage/month, zero egress fees).

### Pre-Deployment Checklist
- [ ] Ensure `JWT_SECRET` is at least 256 bits (32+ alphanumeric characters).
- [ ] Configure `SERVICE_API_KEY` with a distinct cryptographically random UUID/token.
- [ ] Confirm database migrations are applied via Flyway on backend startup.
- [ ] Set `VITE_API_BASE_URL` to point to production backend HTTPS domain.
- [ ] Ensure non-root container users have write permissions to mounted vector storage (`/app/chroma_store`).

---

## 8. Known Limitations & Roadmap
- **Gemini Free Tier Rate Limits:** Google Gemini Free Tier enforces requests-per-minute (RPM) limits. For production workloads with high concurrency, configure a standard tier API key.
- **Mobile Client (`docai-mobile`):** React Native client is planned and structured for future release; core API endpoints support both web and mobile clients.
