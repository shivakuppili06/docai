import requests
import time

BASE_URL = "http://localhost:8080/api"

def register(email, password):
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "fullName": email.split("@")[0]})
    return res

def login(email, password):
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    return res.json().get("token")

# Register
register("usera@test.com", "password")
register("userb@test.com", "password")

token_a = login("usera@test.com", "password")
token_b = login("userb@test.com", "password")

headers_a = {"Authorization": f"Bearer {token_a}"}
headers_b = {"Authorization": f"Bearer {token_b}"}

# Upload as A
files = {"file": ("test.txt", "This is a test document about AI.", "text/plain")}
res = requests.post(f"{BASE_URL}/documents/upload", headers=headers_a, files=files)
doc_id = res.json()["id"]
print(f"Uploaded as A, doc_id: {doc_id}")

# Wait for INDEXED
status = ""
for _ in range(15):
    res = requests.get(f"{BASE_URL}/documents/{doc_id}", headers=headers_a)
    status = res.json().get("status")
    print(f"Status: {status}")
    if status == "INDEXED": break
    time.sleep(2)

# B sees empty
res = requests.get(f"{BASE_URL}/documents", headers=headers_b)
print("B docs:", len(res.json()))

# B gets 403 on A's document
res = requests.get(f"{BASE_URL}/documents/{doc_id}", headers=headers_b)
print("B get doc status code:", res.status_code)
res = requests.get(f"{BASE_URL}/chat/history/{doc_id}", headers=headers_b)
print("B chat history status code:", res.status_code)

# A asks a question
res = requests.post(f"{BASE_URL}/chat/ask", headers=headers_a, json={"documentId": doc_id, "question": "What is this document about?"})
print("A ask status code:", res.status_code)
if res.status_code == 200:
    print("A answer:", res.json().get("content"))

# A deletes document
res = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers_a)
print("A delete status code:", res.status_code)

# Wrong password -> 401
res = requests.post(f"{BASE_URL}/auth/login", json={"email": "usera@test.com", "password": "wrongpassword"})
print("Wrong password status code:", res.status_code)

# Duplicate email -> 400
res = register("usera@test.com", "password")
print("Duplicate email status code:", res.status_code)
