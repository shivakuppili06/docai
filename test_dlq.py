import pika
import json
import os

connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='rabbitmq', port=5672, credentials=pika.PlainCredentials(os.environ.get('RABBITMQ_USER', 'guest'), os.environ.get('RABBITMQ_PASSWORD', 'guest')))
)
channel = connection.channel()

# Publish an invalid message (e.g. non-existent document_id or bad JSON) to trigger worker error
# Wait, the worker processes documentId. If we send documentId = 99999 and storagePath="invalid.txt", 
# the ingest_document will fail when it tries to download from S3.
bad_event = {
    "documentId": 99999,
    "storagePath": "nonexistent/file.pdf"
}

channel.basic_publish(
    exchange='',
    routing_key='document.processing.queue',
    body=json.dumps(bad_event)
)
print("Published bad message to trigger DLQ")

connection.close()
