from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.routers import query, ingest
from app.config import settings

if not settings.service_api_key:
    raise ValueError("SERVICE_API_KEY is missing or empty. Please set it in .env or environment.")

app = FastAPI(title="DocAI RAG Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_service_token(x_service_token: str = Header(...)):
    if x_service_token != settings.service_api_key:
        raise HTTPException(status_code=401, detail="Invalid service token")

app.include_router(query.router, tags=["query"], dependencies=[Depends(verify_service_token)])
app.include_router(ingest.router, tags=["ingest"], dependencies=[Depends(verify_service_token)])


@app.get("/health")
def health():
    return {"status": "ok"}
