from pydantic import BaseModel
from typing import List, Optional


class QueryRequest(BaseModel):
    document_id: int
    question: str


class SourceChunk(BaseModel):
    chunk_index: int
    text_snippet: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]


class IngestRequest(BaseModel):
    document_id: int
    storage_path: str
    owner_id: Optional[int] = None


class IngestResponse(BaseModel):
    document_id: int
    status: str
    chunks_indexed: int
