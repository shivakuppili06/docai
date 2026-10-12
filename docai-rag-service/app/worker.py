import json
import logging
import uuid
import time
import pika
import httpx

from app.config import settings
from app.services.ingestion import ingest_document
import app.logger as app_logger

logger = logging.getLogger("worker")

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

class NonRetryableError(Exception):
    pass

def should_retry(exception):
    if isinstance(exception, NonRetryableError):
        return False
    return True

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception(should_retry)
)
def report_status(document_id: int, status: str, corr_id: str = None):
    """
    Calls back into the Spring Boot backend to update Document.status.
    """
    url = f"{settings.spring_backend_base_url}/api/documents/{document_id}/status"
    headers = {"X-Service-Token": settings.service_api_key}
    if corr_id:
        headers["X-Correlation-ID"] = corr_id
    
    try:
        response = httpx.patch(url, json={"status": status}, headers=headers, timeout=5)
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code
        if status_code in (400, 401, 403, 404, 422):
            logger.error(f"Non-retryable HTTP error {status_code} for doc {document_id}")
            raise NonRetryableError(f"Status {status_code}")
        logger.warning(f"Transient HTTP error {status_code} for doc {document_id}")
        raise
    except httpx.RequestError as e:
        logger.warning(f"Network error reporting status for doc {document_id}: {e}")
        raise

from concurrent.futures import ThreadPoolExecutor
import functools

def process_message_async(ch, method, properties, body, connection, corr_id, req_id):
    app_logger.correlation_id_var.set(corr_id)
    app_logger.request_id_var.set(req_id)
    
    event = json.loads(body)
    document_id = event.get("documentId")
    storage_path = event.get("storagePath")

    logger.info(f"Processing document {document_id} at {storage_path}")

    max_retries = 3
    base_backoff = 2

    for attempt in range(1, max_retries + 1):
        try:
            chunk_count = ingest_document(document_id, storage_path)
            logger.info(json.dumps({
                "event": "document_indexed", "document_id": document_id, 
                "chunks": chunk_count, "attempt": attempt
            }))
            report_status(document_id, "INDEXED", corr_id)
            cb = functools.partial(ch.basic_ack, delivery_tag=method.delivery_tag)
            connection.add_callback_threadsafe(cb)
            return
        except Exception as e:
            logger.error(json.dumps({
                "event": "indexing_failed_attempt", "document_id": document_id, 
                "error": str(e), "attempt": attempt
            }))
            if attempt < max_retries:
                time.sleep(base_backoff ** attempt)
            else:
                logger.error(json.dumps({
                    "event": "indexing_failed_final", "document_id": document_id, 
                    "error": str(e), "reason": "Max retries exceeded"
                }))
                report_status(document_id, "FAILED", corr_id)
                # Do NOT requeue, let it go to the DLQ
                cb = functools.partial(ch.basic_nack, delivery_tag=method.delivery_tag, requeue=False)
                connection.add_callback_threadsafe(cb)
                return

def connect_with_retry(max_retries=10, delay_seconds=3):
    credentials = pika.PlainCredentials(
        settings.rabbitmq_user, settings.rabbitmq_password
    )
    parameters = pika.ConnectionParameters(
        host=settings.rabbitmq_host,
        port=settings.rabbitmq_port,
        credentials=credentials,
    )
    for attempt in range(1, max_retries + 1):
        try:
            connection = pika.BlockingConnection(parameters)
            logger.info(f"Connected to RabbitMQ on attempt {attempt}")
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            logger.warning(
                f"RabbitMQ connection attempt {attempt}/{max_retries} "
                f"failed, retrying in {delay_seconds}s..."
            )
            time.sleep(delay_seconds)
    logger.error("RabbitMQ unavailable after all retries — worker exiting")
    return None

def main():
    connection = connect_with_retry()
    if not connection:
        logger.warning("RabbitMQ unavailable, relying on HTTP fallback. Worker terminating.")
        return
        
    executor = ThreadPoolExecutor(max_workers=settings.doc_worker_concurrency)

    def handle_message(ch, method, properties, body):
        headers = properties.headers or {}
        corr_id = headers.get("X-Correlation-ID", str(uuid.uuid4()))
        req_id = str(uuid.uuid4())
        executor.submit(process_message_async, ch, method, properties, body, connection, corr_id, req_id)

    try:
        channel = connection.channel()
        channel.exchange_declare(exchange="document.dlx", exchange_type="direct", durable=True)
        channel.queue_declare(queue="document.processing.dlq", durable=True)
        channel.queue_bind(exchange="document.dlx", queue="document.processing.dlq", routing_key="document.processing.dlq")

        dlx_args = {
            "x-dead-letter-exchange": "document.dlx",
            "x-dead-letter-routing-key": "document.processing.dlq"
        }
        channel.queue_declare(queue=settings.document_queue_name, durable=True, arguments=dlx_args)
        
        # Set prefetch count to DOC_WORKER_CONCURRENCY so we fetch enough messages for all workers
        channel.basic_qos(prefetch_count=settings.doc_worker_concurrency)
        channel.basic_consume(queue=settings.document_queue_name, on_message_callback=handle_message)

        logger.info(f"Worker listening on '{settings.document_queue_name}' with concurrency {settings.doc_worker_concurrency}...")
        channel.start_consuming()
    except pika.exceptions.AMQPConnectionError as e:
        logger.warning(f"RabbitMQ connection lost. Error: {e}")
    finally:
        executor.shutdown(wait=False)

if __name__ == "__main__":
    main()
