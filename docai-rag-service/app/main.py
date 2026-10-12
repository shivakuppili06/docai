from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.routers import query, ingest
from app.config import settings
import uuid
import app.logger as app_logger # sets up logging
from prometheus_fastapi_instrumentator import Instrumentator

if not settings.service_api_key:
    raise ValueError("SERVICE_API_KEY is missing or empty. Please set it in .env or environment.")
if not settings.gemini_api_key:
    raise ValueError("GEMINI_API_KEY is missing or empty. Please set it in .env or environment.")

app = FastAPI(title="DocAI RAG Service", version="0.1.0")

# Add Prometheus metrics endpoint
Instrumentator().instrument(app).expose(app)

@app.middleware("http")
async def correlation_id_middleware(request, call_next):
    import time
    corr_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
    req_id = str(uuid.uuid4())
    
    app_logger.correlation_id_var.set(corr_id)
    app_logger.request_id_var.set(req_id)
    
    start_time = time.time()
    try:
        response = await call_next(request)
        duration = int((time.time() - start_time) * 1000)
        app_logger.logger.info(
            "Request completed",
            extra={
                "operation": f"{request.method} {request.url.path}",
                "status": response.status_code,
                "durationMs": duration
            }
        )
        response.headers["X-Correlation-ID"] = corr_id
        return response
    except Exception as e:
        duration = int((time.time() - start_time) * 1000)
        app_logger.logger.error(
            "Request failed",
            extra={
                "operation": f"{request.method} {request.url.path}",
                "status": 500,
                "errorType": type(e).__name__,
                "durationMs": duration
            }
        )
        raise

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Service-Token", "Accept"],
)

async def verify_service_token(x_service_token: str = Header(...)):
    if x_service_token != settings.service_api_key:
        raise HTTPException(status_code=401, detail="Invalid service token")

app.include_router(query.router, tags=["query"], dependencies=[Depends(verify_service_token)])
app.include_router(ingest.router, tags=["ingest"], dependencies=[Depends(verify_service_token)])


@app.get("/health")
def health():
    return {"status": "ok"}
