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


def answer_question(document_id: int, question: str) -> tuple[str, list[SourceChunk]]:
    retriever = get_retriever(document_id)
    docs = retriever.invoke(question)

    if not docs:
        return "I couldn't find any indexed content for this document yet.", []

    context = "\n\n".join(d.page_content for d in docs)
    llm = _get_llm()

    chain = RAG_PROMPT | llm
    result = chain.invoke({"context": context, "question": question})

    # Newer Gemini models return content as a list of blocks; extract text.
    raw_content = result.content
    if isinstance(raw_content, list):
        answer = " ".join(
            block.get("text", "") if isinstance(block, dict) else str(block)
            for block in raw_content
        ).strip()
    else:
        answer = str(raw_content)

    # Programmatically strip all asterisks to guarantee they don't show up
    answer = answer.replace("*", "").replace("#", "")

    sources = [
        SourceChunk(
            chunk_index=d.metadata.get("chunk_index", i),
            text_snippet=d.page_content[:200],
        )
        for i, d in enumerate(docs)
    ]

    return answer, sources
