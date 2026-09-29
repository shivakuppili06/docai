from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import QueryRequest, QueryResponse
from app.services.rag_query import answer_question
from app.services.cache import redis_cache

router = APIRouter()

import traceback

@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if redis_cache.is_rate_limited(f"ip:{client_ip}", limit=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests")
        
    try:
        answer, sources = answer_question(req.document_id, req.question)
        return QueryResponse(answer=answer, sources=sources)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import StreamingResponse

@router.post("/query/stream")
async def query_stream(req: QueryRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if redis_cache.is_rate_limited(f"ip:{client_ip}", limit=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests")
        
    from app.services.rag_query import answer_question_stream
    return StreamingResponse(answer_question_stream(req.document_id, req.question), media_type="text/event-stream")
