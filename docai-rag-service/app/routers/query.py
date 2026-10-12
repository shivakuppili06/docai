from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import QueryRequest, QueryResponse
from app.services.rag_query import answer_question
from app.services.cache import redis_cache

router = APIRouter()

import traceback

def _extract_doc_target(req: QueryRequest):
    if req.document_ids and len(req.document_ids) > 0:
        return req.document_ids
    if req.document_id is not None:
        return req.document_id
    raise HTTPException(status_code=400, detail="Either document_id or document_ids must be provided")

@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest, request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if redis_cache.is_rate_limited(f"ip:{client_ip}", limit=10, window_seconds=60):
        raise HTTPException(status_code=429, detail="Too many requests")
        
    target_docs = _extract_doc_target(req)
    try:
        answer, sources = answer_question(target_docs, req.question)
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
        
    target_docs = _extract_doc_target(req)
    from app.services.rag_query import answer_question_stream
    return StreamingResponse(answer_question_stream(target_docs, req.question), media_type="text/event-stream")
