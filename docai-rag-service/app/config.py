import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    chroma_persist_dir: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_store")

    rabbitmq_host: str = os.getenv("RABBITMQ_HOST", "localhost")
    rabbitmq_port: int = int(os.getenv("RABBITMQ_PORT", "5672"))
    rabbitmq_user: str = os.getenv("RABBITMQ_USER", "guest")
    rabbitmq_password: str = os.getenv("RABBITMQ_PASSWORD", "guest")
    document_queue_name: str = os.getenv("DOCUMENT_QUEUE_NAME", "document.processing.queue")
    doc_worker_concurrency: int = int(os.getenv("DOC_WORKER_CONCURRENCY", "4"))

    spring_backend_base_url: str = os.getenv("SPRING_BACKEND_URL", "http://localhost:8080")
    service_api_key: str = os.getenv("SERVICE_API_KEY", "")

    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket: str = os.getenv("AWS_S3_BUCKET", "")
    
    redis_host: str = os.getenv("REDIS_HOST", "localhost")
    redis_port: int = int(os.getenv("REDIS_PORT", "6379"))

    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:8080,http://localhost:5173")

    embedding_model: str = os.getenv("EMBEDDING_MODEL", "models/gemini-embedding-001")
    chat_model: str = os.getenv("CHAT_MODEL", "gemini-3.5-flash-lite")
    chat_api_version: str = "v1beta"

    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "150"))
    retrieval_k: int = int(os.getenv("RETRIEVAL_K", "4"))
    
    llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "5"))
    llm_timeout: int = int(os.getenv("LLM_TIMEOUT", "30"))
    cache_ttl: int = int(os.getenv("CACHE_TTL", "3600"))

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
