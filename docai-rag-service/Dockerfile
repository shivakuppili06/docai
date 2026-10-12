# Production Dockerfile for DocAI RAG FastAPI Service
FROM python:3.11-slim

WORKDIR /app

# Create non-root user for security
RUN groupadd -r docai && useradd -r -g docai -d /app -s /sbin/nologin docai

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout 120 -r requirements.txt

COPY app ./app
RUN chown -R docai:docai /app

USER docai
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
