from fastapi import APIRouter, HTTPException

from app.models.schemas import IngestRequest, IngestResponse
from app.services.ingestion import ingest_document, delete_document_vectors

router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest):
    """
    Manual/direct ingestion trigger — useful for testing without RabbitMQ running.
    In production this is normally triggered by the queue consumer (worker.py).
    """
    try:
        chunk_count = ingest_document(req.document_id, req.storage_path)
        return IngestResponse(document_id=req.document_id, status="INDEXED", chunks_indexed=chunk_count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
def delete_document(document_id: int):
    """
    Deletes the vector collection for a given document.
    """
    try:
        delete_document_vectors(document_id)
        return {"status": "DELETED"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
