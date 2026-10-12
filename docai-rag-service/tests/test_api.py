import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings
from unittest.mock import patch, MagicMock

# Set up test client
client = TestClient(app)

@pytest.fixture(autouse=True)
def bypass_rate_limit(monkeypatch):
    monkeypatch.setattr("app.services.cache.redis_cache.is_rate_limited", lambda key, limit, window_seconds: False)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_query_unauthorized():
    headers = {"X-Service-Token": "wrong-token"}
    response = client.post("/query", json={"document_id": 1, "question": "What is this?"}, headers=headers)
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid service token"}

@patch("app.routers.query.answer_question")
def test_query_success(mock_answer_question):
    # SourceChunk expects chunk_index and text_snippet
    mock_source = {"page": 1, "text_snippet": "Some text", "chunk_index": 0, "distance": 0.1}
    mock_answer_question.return_value = ("This is a test answer.", [mock_source])
    
    headers = {"X-Service-Token": settings.service_api_key}
    response = client.post("/query", json={"document_id": 1, "question": "What is this?"}, headers=headers)
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["answer"] == "This is a test answer."
    assert res_data["sources"][0]["chunk_index"] == 0
    assert res_data["sources"][0]["text_snippet"] == "Some text"
    mock_answer_question.assert_called_once_with(1, "What is this?")

@patch("app.routers.ingest.ingest_document")
def test_ingest_success(mock_ingest_document):
    mock_ingest_document.return_value = 5
    
    headers = {"X-Service-Token": settings.service_api_key}
    response = client.post("/ingest", json={"document_id": 1, "storage_path": "test/path.pdf", "owner_id": 2}, headers=headers)
    
    assert response.status_code == 200
    assert response.json() == {
        "document_id": 1,
        "status": "INDEXED",
        "chunks_indexed": 5
    }
    mock_ingest_document.assert_called_once_with(1, "test/path.pdf")

@patch("app.routers.ingest.delete_document_vectors")
def test_delete_document(mock_delete_document_vectors):
    headers = {"X-Service-Token": settings.service_api_key}
    response = client.delete("/documents/1", headers=headers)
    
    assert response.status_code == 200
    assert response.json() == {"status": "DELETED"}
    mock_delete_document_vectors.assert_called_once_with(1)

def test_query_missing_doc_target():
    headers = {"X-Service-Token": settings.service_api_key}
    response = client.post("/query", json={"question": "What is this?"}, headers=headers)
    assert response.status_code == 400
    assert "Either document_id or document_ids must be provided" in response.json()["detail"]

def test_query_rate_limited(monkeypatch):
    monkeypatch.setattr("app.services.cache.redis_cache.is_rate_limited", lambda key, limit, window_seconds: True)
    headers = {"X-Service-Token": settings.service_api_key}
    response = client.post("/query", json={"document_id": 1, "question": "What is this?"}, headers=headers)
    assert response.status_code == 429
    assert response.json()["detail"] == "Too many requests"

@patch("app.routers.query.answer_question")
def test_query_multi_doc_success(mock_answer_question):
    mock_source = {"page": 1, "text_snippet": "Multi-doc excerpt", "chunk_index": 0, "distance": 0.05}
    mock_answer_question.return_value = ("Comparison answer.", [mock_source])
    
    headers = {"X-Service-Token": settings.service_api_key}
    response = client.post("/query", json={"document_ids": [1, 2], "question": "Compare documents"}, headers=headers)
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["answer"] == "Comparison answer."
    mock_answer_question.assert_called_once_with([1, 2], "Compare documents")

