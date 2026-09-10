# Next Steps — DocAI (pick up here tomorrow)

## EC2 Deployment
- [ ] Launch EC2 instance (Ubuntu 22.04, t3.small minimum, open ports 22/80/443/8080/8000/5173)
- [ ] SSH in, install Docker + Docker Compose on the instance
- [ ] Clone repo: `git clone https://github.com/shivakuppili06/docai.git`
- [ ] Create real `.env` files on the server (never commit — copy values from local `.env`)
- [ ] Run: `docker compose up --build -d` (starts all services)
- [ ] Verify each service is up: `docker compose ps`

## Frontend Static Hosting (optional, after EC2)
- [ ] Build: `cd docai-frontend && npm run build`
- [ ] Deploy `dist/` to S3 static website or CloudFront

## Security Hardening (before making public)
- [ ] Restrict CORS in `SecurityConfig.java` from wildcard `*` to actual frontend domain
- [ ] Add shared-secret / service-auth to `/api/documents/*/status` endpoint
  - Currently marked with TODO in `SecurityConfig.java:50` — open so Python worker can call without a user JWT
- [ ] Verify IDOR protection: confirm `/api/documents/{id}` and `/api/chat/ask` check ownership against the authenticated user
- [ ] Add rate limiting on `/api/chat/ask` (currently unlimited — could burn Gemini API quota)

## Infrastructure
- [ ] ChromaDB is currently on local disk (`./chroma_store`) — will be lost if the EC2 container restarts
  - Fix: mount an EFS volume, or migrate to a hosted vector DB (e.g., Pinecone, Qdrant Cloud)
- [ ] Set up automatic backups for Neon database

## Nice-to-haves
- [ ] Add proper error messages to frontend (currently shows raw HTTP status codes in some paths)
- [ ] Replace `IllegalArgumentException` in `AuthService.register` with a proper 409 Conflict response
- [ ] Add document status polling on the Dashboard so PROCESSING → INDEXED updates automatically without a page refresh
