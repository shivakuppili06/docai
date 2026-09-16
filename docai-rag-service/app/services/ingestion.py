import os
import tempfile
import boto3
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
import chromadb

from app.config import settings


def _get_embeddings():
    return GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.gemini_api_key,
    )


def _extract_text(storage_path: str) -> str:
    if storage_path.lower().endswith(".pdf"):
        reader = PdfReader(storage_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    with open(storage_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def _collection_name(document_id: int) -> str:
    return f"document_{document_id}"


def _clear_existing_collection(document_id: int):
    """
    Deletes any pre-existing Chroma collection for this document_id 
    before re-ingesting. Makes ingestion idempotent — critical because 
    document IDs can get reused (e.g. after a Postgres reset), and 
    without this, old chunks silently mix with new ones.
    """
    client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
    name = _collection_name(document_id)
    try:
        client.delete_collection(name=name)
    except Exception:
        pass  # collection didn't exist yet — nothing to clear

def delete_document_vectors(document_id: int):
    """
    Public method to delete a document's vector collection from ChromaDB.
    """
    _clear_existing_collection(document_id)


def ingest_document(document_id: int, storage_path: str) -> int:
    """
    Extracts text, chunks it, embeds each chunk via Gemini, and stores
    vectors in a per-document Chroma collection. Returns chunk count.
    """
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region
    )

    s3_key = storage_path
    suffix = ".pdf" if s3_key.lower().endswith(".pdf") else ".txt"
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        local_file_path = tmp_file.name

    try:
        s3_client.download_file(settings.s3_bucket, s3_key, local_file_path)
        text = _extract_text(local_file_path)
    finally:
        if os.path.exists(local_file_path):
            os.remove(local_file_path)

    if not text.strip():
        raise ValueError("Extracted text is empty — unsupported or scanned file?")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )
    chunks = splitter.split_text(text)

    _clear_existing_collection(document_id)

    embeddings = _get_embeddings()

    vectordb = Chroma(
        collection_name=_collection_name(document_id),
        embedding_function=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )

    metadatas = [{"chunk_index": i, "document_id": document_id} for i in range(len(chunks))]
    vectordb.add_texts(texts=chunks, metadatas=metadatas)

    return len(chunks)


def get_retriever(document_id: int):
    embeddings = _get_embeddings()
    vectordb = Chroma(
        collection_name=_collection_name(document_id),
        embedding_function=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )
    return vectordb.as_retriever(search_kwargs={"k": settings.retrieval_k})
