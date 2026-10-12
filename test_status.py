import jwt
import requests
import datetime

secret = 'docai-local-jwt-secret-key-minimum-32-bytes-long-ok!!'
token = jwt.encode(
    {'sub': 'test@example.com', 'userId': 1, 'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1), 'iat': datetime.datetime.utcnow()},
    secret, algorithm='HS256'
)
headers = {'Authorization': f'Bearer {token}'}

resp = requests.get("http://docai-backend:8080/api/documents", headers=headers)
docs = resp.json()
print("All documents:")
for d in docs:
    print(f"ID: {d.get('id')} - Status: {d.get('status')}")
