import pytest
from unittest.mock import patch, MagicMock
from app.services.rag_query import answer_question
from app.models.schemas import SourceChunk

@patch("app.services.rag_query.redis_cache")
@patch("app.services.rag_query.get_retriever")
@patch("app.services.rag_query._get_llm")
def test_answer_question_no_docs(mock_get_llm, mock_get_retriever, mock_redis_cache):
    mock_redis_cache.get_query_result.return_value = None
    
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = []
    mock_get_retriever.return_value = mock_retriever
    
    answer, sources = answer_question(1, "What is this?")
    
    assert answer == "I couldn't find any indexed content for this document yet."
    assert sources == []
    mock_get_llm.assert_not_called()

@patch("app.services.rag_query.RAG_PROMPT")
@patch("app.services.rag_query.redis_cache")
@patch("app.services.rag_query.get_retriever")
@patch("app.services.rag_query._get_llm")
def test_answer_question_with_docs(mock_get_llm, mock_get_retriever, mock_redis_cache, mock_rag_prompt):
    mock_redis_cache.get_query_result.return_value = None
    
    # Mock document returned by retriever
    mock_doc = MagicMock()
    mock_doc.page_content = "This is a test document about Python."
    mock_doc.metadata = {"chunk_index": 0}
    
    mock_retriever = MagicMock()
    mock_retriever.invoke.return_value = [mock_doc]
    mock_get_retriever.return_value = mock_retriever
    
    # Mock LLM and chain
    mock_llm = MagicMock()
    mock_get_llm.return_value = mock_llm
    
    # Langchain's RunnableSequence calls invoke on the LLM
    mock_result = MagicMock()
    mock_result.content = "This is a test answer."
    
    mock_chain = MagicMock()
    mock_chain.invoke.return_value = mock_result
    mock_rag_prompt.__or__.return_value = mock_chain
    
    answer, sources = answer_question(1, "What is this?")
    
    assert answer == "This is a test answer."
    assert len(sources) == 1
    assert sources[0].chunk_index == 0
    assert sources[0].text_snippet == "This is a test document about Python."
    mock_redis_cache.set_query_result.assert_called_once()
