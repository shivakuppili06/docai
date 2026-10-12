import logging
import sys
import contextvars
from pythonjsonlogger import jsonlogger

correlation_id_var = contextvars.ContextVar('correlation_id', default=None)
request_id_var = contextvars.ContextVar('request_id', default=None)

class CustomJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        if not log_record.get('timestamp'):
            log_record['timestamp'] = self.formatTime(record, self.datefmt)
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname

        # Add correlation IDs from context
        corr_id = correlation_id_var.get()
        if corr_id:
            log_record['correlationId'] = corr_id
            
        req_id = request_id_var.get()
        if req_id:
            log_record['requestId'] = req_id

        log_record['app'] = 'docai-rag-service'

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    logHandler = logging.StreamHandler(sys.stdout)
    formatter = CustomJsonFormatter('%(timestamp)s %(level)s %(name)s %(message)s')
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)

    # Suppress verbose loggers
    logging.getLogger('pika').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.access').handlers = [logHandler]

    return logging.getLogger("docai.rag")

logger = setup_logging()
