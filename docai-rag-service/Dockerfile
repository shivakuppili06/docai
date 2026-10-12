# Production Dockerfile for DocAI RAG FastAPI Service
FROM python:3.11-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r docai && useradd -r -g docai -d /app -s /sbin/nologin docai

# Install gosu for secure privilege dropping in entrypoint
RUN apt-get update && apt-get install -y --no-install-recommends gosu && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout 120 -r requirements.txt

COPY app ./app
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown -R docai:docai /app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

