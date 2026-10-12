import requests
import json
import os

BASE_URL = "http://localhost:8080/api"

# 1. Register and Login
def get_token():
    email = "upload_test@test.com"
    pwd = "password123"
    requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": pwd, "fullName": "Test User"})
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": pwd})
    return res.json().get("token")

token = get_token()
headers = {"Authorization": f"Bearer {token}"}

def upload(filename, content, content_type=None, field_filename=None):
    files = {"file": (field_filename or filename, content, content_type)}
    return requests.post(f"{BASE_URL}/documents/upload", headers=headers, files=files)

# Test 1: Oversized file (21 MB)
oversized_content = b"a" * (21 * 1024 * 1024)
r1 = upload("oversized.txt", oversized_content, "text/plain")
print("Oversized status:", r1.status_code)

# Test 2: Path traversal filename
r2 = upload("test.txt", b"hello", "text/plain", field_filename="../etc/passwd.txt")
print("Path traversal status:", r2.status_code)

# Test 3: Disguised file (txt file disguised as pdf)
r3 = upload("fake.pdf", b"This is not a pdf", "application/pdf")
print("Disguised file status:", r3.status_code)

