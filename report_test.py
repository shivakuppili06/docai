import requests
import time
import json
import uuid

BASE_URL = "http://localhost:8080/api"

def print_result(name, res):
    print(f"[{name}] Status: {res.status_code}")
    try:
        print(f"[{name}] Body: {res.json()}")
    except:
        print(f"[{name}] Body: {res.text[:100]}")
    print("-" * 40)

# Generate unique emails
email_a = f"usera_{uuid.uuid4().hex[:6]}@test.com"
email_b = f"userb_{uuid.uuid4().hex[:6]}@test.com"

# 1. Register
res_reg_a = requests.post(f"{BASE_URL}/auth/register", json={"email": email_a, "password": "password", "fullName": "User A"})
print_result("Register A", res_reg_a)

res_reg_b = requests.post(f"{BASE_URL}/auth/register", json={"email": email_b, "password": "password", "fullName": "User B"})
print_result("Register B", res_reg_b)

# 2. Login
res_login_a = requests.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": "password"})
print_result("Login A", res_login_a)
token_a = res_login_a.json().get("token")

res_login_b = requests.post(f"{BASE_URL}/auth/login", json={"email": email_b, "password": "password"})
token_b = res_login_b.json().get("token")

headers_a = {"Authorization": f"Bearer {token_a}"}
headers_b = {"Authorization": f"Bearer {token_b}"}

# 3. Upload Document
files = {"file": ("report_test.txt", "This is a test document about AI and data science.", "text/plain")}
res_upload = requests.post(f"{BASE_URL}/documents/upload", headers=headers_a, files=files)
print_result("Upload A", res_upload)
doc_id = res_upload.json().get("id")

# Wait for processing
print("Waiting for indexing...")
time.sleep(10)

# 4. List Documents
res_list = requests.get(f"{BASE_URL}/documents", headers=headers_a)
print_result("List Docs A", res_list)

# 5. IDOR Check: B tries to access A's document
res_chat_history_b = requests.get(f"{BASE_URL}/chat/history/{doc_id}", headers=headers_b)
print_result("IDOR: B reads A's chat history", res_chat_history_b)

# 6. Chat Ask
res_ask = requests.post(f"{BASE_URL}/chat/ask", headers=headers_a, json={"documentId": doc_id, "question": "What is this document about?"})
print_result("Chat Ask", res_ask)

# 7. Chat History
res_history = requests.get(f"{BASE_URL}/chat/history/{doc_id}", headers=headers_a)
print_result("Chat History", res_history)

# 8. Delete Document
res_del = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers_a)
print_result("Delete A", res_del)
