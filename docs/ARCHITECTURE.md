# DocAI Architecture Documentation

## High-Level Design (HLD)

DocAI is a microservices-based Document Intelligence Platform designed for scalable ingestion, processing, and querying of documents using LLMs.

### System Components & Flow

1.  **Frontend (React/Vite)**
    *   **Responsibility**: Provides the user interface for document upload, management, analytics, and chat interactions.
    *   **Communication**: Communicates with the Spring Boot Backend via REST APIs and Server-Sent Events (SSE) for streaming chat responses.

2.  **Spring Boot Backend (API Gateway & Core Logic)**
    *   **Responsibility**: Acts as the primary entry point for all frontend requests. It handles user authentication (JWT), Role-Based Access Control (RBAC), document metadata management (PostgreSQL), and S3 storage orchestration.
    *   **Communication**: 
        *   Accepts REST calls from the frontend.
        *   Publishes document ingestion tasks to RabbitMQ.
        *   Proxies chat queries synchronously (or via SSE) to the RAG Service using service-token authentication (`X-Service-Token`).

3.  **RabbitMQ (Message Broker)**
    *   **Responsibility**: Decouples the document upload process from the heavy lifting of document parsing, chunking, and embedding.
    *   **Communication**: Receives `DocumentProcessingEvent` messages from the Spring Boot backend and delivers them to the RAG Worker.

4.  **RAG Service (Python/FastAPI - API & Worker)**
    *   **Responsibility**: The core AI engine. It consists of two parts:
        *   **Worker**: Consumes messages from RabbitMQ, fetches the document from S3, extracts text, chunks it, generates embeddings via Gemini, and stores them in ChromaDB.
        *   **API**: Serves the `/query` and `/query/stream` endpoints to perform vector similarity searches and construct LLM prompts for question answering.
    *   **Communication**: 
        *   Worker sends status updates back to the Spring Boot Backend (`PATCH /api/documents/{id}/status`).
        *   API responds to queries from the Spring Boot Backend.

5.  **Data Stores & External Services**
    *   **PostgreSQL**: Relational database for users, document metadata, and chat history.
    *   **AWS S3**: Object storage for raw uploaded documents.
    *   **ChromaDB**: Local vector database for storing document embeddings.
    *   **Redis**: Caching layer for query results and rate limiting.
    *   **Google Gemini API**: External provider for text embeddings (`models/gemini-embedding-001`) and chat generation (`gemini-3.8-flash`).

---

## Low-Level Design (LLD) - RAG Service

The RAG (Retrieval-Augmented Generation) service is the python-based intelligence core of DocAI, responsible for transforming raw documents into searchable vectors and synthesizing answers.

### 1. Ingestion Pipeline
When a user uploads a document, the Spring Boot backend saves it to S3 and queues a task. The RAG Worker processes this task asynchronously:

*   **Extraction**: The worker downloads the file from S3 and extracts the raw text (e.g., using `PyPDFLoader`).
*   **Chunking Strategy**: The text is split using a `RecursiveCharacterTextSplitter`.
    *   `chunk_size`: 1000 characters.
    *   `chunk_overlap`: 150 characters (ensures context is maintained across chunk boundaries).
*   **Embedding**: Each chunk is embedded using the `models/gemini-embedding-001` model.
*   **Vector Storage (ChromaDB)**:
    *   **Collection-per-Document**: Each document is stored in its own isolated ChromaDB collection, named `doc_{document_id}`. This ensures strong tenant isolation at the vector level and vastly speeds up document-specific queries.
    *   **Idempotency**: Before ingestion begins, the worker explicitly attempts to delete any existing collection with the same name (`drop-and-recreate`). This ensures that retries (e.g., due to transient failures) do not result in duplicate vectors.
*   **Callback**: Upon completion or failure, the worker sends a REST call back to the Spring Boot backend to update the document's status (`INDEXED` or `FAILED`).

### 2. Query Pipeline & Caching
When a user asks a question about a document, the request flows to the RAG API (`/query` or `/query/stream`):

*   **Redis Caching Layer**:
    *   Before performing any vector search or LLM invocation, the API checks Redis.
    *   **Key Structure**: `query_cache:{document_id}:{hash(question)}`.
    *   **TTL Policy**: Cached results expire after 3600 seconds (1 hour).
    *   If a cache hit occurs, the exact answer and citations are returned immediately, bypassing ChromaDB and Gemini. This significantly reduces latency and API costs for repeated questions.
*   **Retrieval (Top-K)**: On a cache miss, the service connects to the specific `doc_{document_id}` ChromaDB collection and performs a similarity search against the embedded question, retrieving the top `k=4` most relevant chunks.
*   **Prompt Construction**: The retrieved chunks are concatenated and injected into a strict `ChatPromptTemplate` that instructs the LLM to answer *only* using the provided context and formatting rules.
*   **LLM Synthesis & Citation**: The `gemini-3.8-flash` model synthesizes the final answer. The chunks used for context are packaged as citations (`SourceChunk` containing chunk index and a text snippet) and returned alongside the answer.
*   **Cache Population**: The final synthesized answer and sources are serialized to JSON and stored in Redis under the query key.
