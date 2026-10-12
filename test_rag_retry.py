import sys
import os
import logging
logging.basicConfig(level=logging.INFO)

sys.path.append("/app")
from app.worker import report_status, settings

# Test permanent failure (Auth error - 401)
# we use the wrong API key so it will get a 401
original_key = settings.service_api_key
settings.service_api_key = "wrong-key"
print("Testing permanent failure (401)...")
try:
    report_status(1, "FAILED")
except Exception as e:
    print("Caught:", type(e).__name__)

settings.service_api_key = original_key

# Test transient failure (Connection error - bad host)
print("Testing transient failure (Connection error)...")
settings.spring_backend_base_url = "http://localhost:9999"
try:
    report_status(1, "FAILED")
except Exception as e:
    print("Caught:", type(e).__name__)
