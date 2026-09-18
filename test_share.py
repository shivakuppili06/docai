import requests
import time
import json
import base64

BASE_URL = "http://localhost:8080/api"

def register(email, password):
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password, "fullName": email.split("@")[0]})
    return res

def login(email, password):
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    return res.json().get("token")

def get_user_id(token):
    payload_b64 = token.split(".")[1]
    payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
    payload = json.loads(base64.urlsafe_b64decode(payload_b64).decode())
    return payload.get("userId") or payload.get("id") or payload.get("sub")

# Register
register("usera_share@test.com", "password")
register("userb_share@test.com", "password")
register("userc_share@test.com", "password")

token_a = login("usera_share@test.com", "password")
token_b = login("userb_share@test.com", "password")
token_c = login("userc_share@test.com", "password")

headers_a = {"Authorization": f"Bearer {token_a}"}
headers_b = {"Authorization": f"Bearer {token_b}"}
headers_c = {"Authorization": f"Bearer {token_c}"}

user_b_id = get_user_id(token_b)

# Upload as A
files = {"file": ("test_share.txt", "Shared document.", "text/plain")}
res = requests.post(f"{BASE_URL}/documents/upload", headers=headers_a, files=files)
doc_id = res.json()["id"]
print(f"Uploaded as A, doc_id: {doc_id}")

# Share with B as VIEWER
res = requests.post(f"{BASE_URL}/documents/{doc_id}/share?userId={user_b_id}&role=VIEWER", headers=headers_a)
print("Share with B status:", res.status_code)

# B sees it in their document list
print("B get docs status:", res.status_code)
if res.status_code != 200:
    print("B docs response:", res.text[:200])
else:
    b_docs = res.json()
if len(b_docs) > 0:
    print("B first doc ID:", b_docs[0]["id"])

# C does not see it
res = requests.get(f"{BASE_URL}/documents", headers=headers_c)
print("C docs:", len(res.json()))

# B can ask a question (VIEWER)
res = requests.post(f"{BASE_URL}/chat/ask", headers=headers_b, json={"documentId": doc_id, "question": "What is this?"})
print("B ask status code:", res.status_code)

# B tries to delete
res = requests.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers_b)
print("B delete status code:", res.status_code)

# B tries to reshare
res = requests.post(f"{BASE_URL}/documents/{doc_id}/share?userId={get_user_id(token_c)}&role=VIEWER", headers=headers_b)
print("B reshare status code:", res.status_code)
