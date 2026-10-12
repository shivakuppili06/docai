import jwt
import requests
import datetime
import os

# Create JWT token
secret = 'docai-local-jwt-secret-key-minimum-32-bytes-long-ok!!'
token = jwt.encode(
    {
        'sub': 'test@example.com',
        'userId': 1,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1),
        'iat': datetime.datetime.utcnow()
    },
    secret,
    algorithm='HS256'
)

headers = {'Authorization': f'Bearer {token}'}

print("1. Uploading a test document...")
files = {'file': ('test.txt', b'This is a test document for S3 failure simulation.', 'text/plain')}
upload_resp = requests.post("http://docai-backend:8080/api/documents/upload", headers=headers, files=files)
if upload_resp.status_code != 200:
    print("Upload failed:", upload_resp.text)
    exit(1)

doc_id = upload_resp.json().get('id')
print(f"Uploaded successfully. Document ID: {doc_id}")

print(f"2. Deleting document {doc_id} (simulating S3 failure)...")
delete_resp = requests.delete(f"http://docai-backend:8080/api/documents/{doc_id}", headers=headers)
if delete_resp.status_code != 204:
    print("Delete API returned error:", delete_resp.status_code, delete_resp.text)

print(f"3. Verifying document state in DB...")
# The backend doesn't expose a GET /status endpoint directly, but we can query postgres.
# Let's query postgres using psql.
