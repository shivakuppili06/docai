import abc
import chromadb
from langchain_chroma import Chroma
from app.config import settings

class VectorStoreService(abc.ABC):
    @abc.abstractmethod
    def clear_document(self, document_id: int):
        pass

    @abc.abstractmethod
    def add_texts(self, document_id: int, texts: list[str], metadatas: list[dict], embeddings):
        pass

    @abc.abstractmethod
    def get_retriever(self, document_id: int, embeddings, k: int | None = None):
        pass


class ChromaVectorStore(VectorStoreService):
    def _collection_name(self, document_id: int) -> str:
        return f"document_{document_id}"

    def clear_document(self, document_id: int):
        client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        try:
            client.delete_collection(name=self._collection_name(document_id))
        except Exception:
            pass

    def add_texts(self, document_id: int, texts: list[str], metadatas: list[dict], embeddings):
        vectordb = Chroma(
            collection_name=self._collection_name(document_id),
            embedding_function=embeddings,
            persist_directory=settings.chroma_persist_dir,
        )
        vectordb.add_texts(texts=texts, metadatas=metadatas)

    def get_retriever(self, document_id: int, embeddings, k: int | None = None):
        vectordb = Chroma(
            collection_name=self._collection_name(document_id),
            embedding_function=embeddings,
            persist_directory=settings.chroma_persist_dir,
        )
        return vectordb.as_retriever(search_kwargs={"k": k if k is not None else settings.retrieval_k})


def get_vector_store() -> VectorStoreService:
    # Driven by env var for future cloud vector db
    store_type = getattr(settings, "vector_store_type", "chroma")
    if store_type == "chroma":
        return ChromaVectorStore()
    else:
        raise ValueError(f"Unsupported vector store type: {store_type}")
