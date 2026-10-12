import requests
import json
import jwt
import datetime

BACKEND_URL = "http://localhost:8080"
SERVICE_TOKEN = "docai-internal-service-key-local-dev-2026" # Assuming this is what's in the test config

# Create a mock JWT token
payload = {
    "sub": "test@example.com",
    "userId": 1,
    "iat": datetime.datetime.utcnow(),
    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
}
secret = "my-very-long-secret-key-that-is-at-least-256-bits" # from .env.example
token = jwt.encode(payload, secret, algorithm="HS256")

headers = {"Content-Type": "application/json"}
data = {"status": "INDEXED"}

# 1. Missing token
r1 = requests.patch(f"{BACKEND_URL}/api/documents/1/status", headers=headers, json=data)
print(f"Missing token status: {r1.status_code}")

# 2. Invalid token
r2 = requests.patch(f"{BACKEND_URL}/api/documents/1/status", headers={**headers, "X-Service-Token": "INVALID"}, json=data)
print(f"Invalid token status: {r2.status_code}")

# 3. Valid token
r3 = requests.patch(f"{BACKEND_URL}/api/documents/1/status", headers={**headers, "X-Service-Token": SERVICE_TOKEN}, json=data)
print(f"Valid token status: {r3.status_code}")

# 4. User JWT
r4 = requests.patch(f"{BACKEND_URL}/api/documents/1/status", headers={**headers, "Authorization": f"Bearer {token}"}, json=data)
print(f"User JWT status: {r4.status_code}")
