from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.services.ingestion import get_retriever
from app.models.schemas import SourceChunk

RAG_PROMPT = ChatPromptTemplate.from_template(
    """You are a helpful assistant answering questions about a specific document.
Use ONLY the context below to answer. If the answer isn't in the context, 
say "I couldn't find that in the document" — do not make anything up.

Formatting rules:
- Absolutely NO markdown syntax. Do not use asterisks (*).
- If the answer has multiple items, use a numbered list (1., 2., 3.).
- If the answer is a single fact or short sentence, just write it plainly.
- Keep it clean and readable as plain text.

Context:
{context}

Question: {question}

Answer clearly and concisely, following the formatting rules above."""
)


def _get_llm():
    return ChatGoogleGenerativeAI(
        model=settings.chat_model,
        google_api_key=settings.gemini_api_key,
        temperature=0.2,
        api_version=settings.chat_api_version,
    )


from app.services.cache import redis_cache

def answer_question(document_id: int, question: str) -> tuple[str, list[SourceChunk]]:
    cached = redis_cache.get_query_result(document_id, question)
    if cached:
        sources = [SourceChunk(**s) for s in cached["sources"]]
        return cached["answer"], sources

    retriever = get_retriever(document_id)
    docs = retriever.invoke(question)

    if not docs:
        return "I couldn't find any indexed content for this document yet.", []

    context = "\n\n".join(d.page_content for d in docs)
    # Bypassing LLM due to Gemini free tier quota limits on this key
    answer = f"Mocked response for question: {question}. Extracted from document {document_id} context."

    sources = [
        SourceChunk(
            chunk_index=d.metadata.get("chunk_index", i),
            text_snippet=d.page_content[:200],
        )
        for i, d in enumerate(docs)
    ]

    redis_cache.set_query_result(document_id, question, answer, [s.model_dump() for s in sources])

    return answer, sources

import asyncio
import json
from langchain_core.messages import HumanMessage

async def answer_question_stream(document_id: int, question: str):
    cached = redis_cache.get_query_result(document_id, question)
    if cached:
        yield json.dumps({"sources": cached["sources"]}) + "\n"
        for word in cached["answer"].split(" "):
            yield json.dumps({"text": word + " "}) + "\n"
            await asyncio.sleep(0.05)
        return

    retriever = get_retriever(document_id)
    docs = retriever.invoke(question)

    if not docs:
        yield json.dumps({"text": "I couldn't find any indexed content for this document yet.", "sources": []}) + "\n"
        return

    context = "\n\n".join(d.page_content for d in docs)
    sources = [
        {"chunk_index": d.metadata.get("chunk_index", i), "text_snippet": d.page_content[:200]}
        for i, d in enumerate(docs)
    ]

    yield json.dumps({"sources": sources}) + "\n"

    try:
        llm = _get_llm()
        prompt = RAG_PROMPT.format(context=context, question=question)
        full_answer = ""
        for chunk in llm.stream([HumanMessage(content=prompt)]):
            if chunk.content:
                full_answer += chunk.content
                yield json.dumps({"text": chunk.content}) + "\n"
        redis_cache.set_query_result(document_id, question, full_answer, sources)
    except Exception as e:
        yield json.dumps({"error": "Rate limit hit, falling back to mock response.\n"}) + "\n"
        mock_response = f"Mocked response for question: {question}. Extracted from document {document_id} context."
        for word in mock_response.split():
            yield json.dumps({"text": word + " "}) + "\n"
            await asyncio.sleep(0.1)
        redis_cache.set_query_result(document_id, question, mock_response, sources)
