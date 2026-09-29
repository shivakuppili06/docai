from fastapi import APIRouter, HTTPException

from app.models.schemas import QueryRequest, QueryResponse
from app.services.rag_query import answer_question

router = APIRouter()


import traceback

@router.post("/query", response_model=QueryResponse)
def query(req: QueryRequest):
    try:
        answer, sources = answer_question(req.document_id, req.question)
        return QueryResponse(answer=answer, sources=sources)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
