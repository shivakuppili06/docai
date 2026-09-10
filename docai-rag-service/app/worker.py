import json
import logging

import pika
import httpx

from app.config import settings
from app.services.ingestion import ingest_document

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker")


def report_status(document_id: int, status: str):
    """
    Calls back into the Spring Boot backend to update Document.status.
    NOTE: requires a corresponding PATCH /api/documents/{id}/status endpoint
    on the Spring side — add one (internal/service-to-service call, not
    exposed to end users) if it doesn't exist yet.
    """
    try:
        url = f"{settings.spring_backend_base_url}/api/documents/{document_id}/status"
        headers = {"X-Service-Token": settings.service_api_key}
        httpx.patch(url, json={"status": status}, headers=headers, timeout=10)
    except Exception as e:
        logger.warning(f"Failed to report status for doc {document_id}: {e}")


def handle_message(ch, method, properties, body):
    event = json.loads(body)
    document_id = event.get("documentId")
    storage_path = event.get("storagePath")

    logger.info(f"Processing document {document_id} at {storage_path}")

    try:
        chunk_count = ingest_document(document_id, storage_path)
        logger.info(f"Indexed document {document_id} — {chunk_count} chunks")
        report_status(document_id, "INDEXED")
    except Exception as e:
        logger.error(f"Failed to process document {document_id}: {e}")
        report_status(document_id, "FAILED")
    finally:
        ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    credentials = pika.PlainCredentials(settings.rabbitmq_user, settings.rabbitmq_password)
    parameters = pika.ConnectionParameters(
        host=settings.rabbitmq_host,
        port=settings.rabbitmq_port,
        credentials=credentials,
    )

    try:
        connection = pika.BlockingConnection(parameters)
        channel = connection.channel()
        channel.queue_declare(queue=settings.document_queue_name, durable=True)
        channel.basic_qos(prefetch_count=1)
        channel.basic_consume(queue=settings.document_queue_name, on_message_callback=handle_message)

        logger.info(f"Worker listening on '{settings.document_queue_name}'...")
        channel.start_consuming()
    except pika.exceptions.AMQPConnectionError as e:
        logger.warning(f"RabbitMQ unavailable, relying on HTTP fallback. Error: {e}")


if __name__ == "__main__":
    main()
