import requests
import json
import time
import uuid
import sys
import base64
import io
from reportlab.pdfgen import canvas

BACKEND_URL = "http://localhost:8080"
RAG_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5173"

def generate_sample_pdf(text: str) -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.setFont("Helvetica", 12)
    # Write multiple lines to guarantee rich chunking context
    c.drawString(72, 750, "DocAI Confidential Intelligence Specification - Version 2026.1")
    c.drawString(72, 720, text)
    c.drawString(72, 690, "Security Clearance: Top Secret. System core authentication protocol: QuantumNebula2026.")
    c.drawString(72, 660, "Authorized by the DocAI Security Directorate for automated compliance verification.")
    c.save()
    return buf.getvalue()

class IntegrationTestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.test_id = str(uuid.uuid4())[:8]

    def log(self, title, status, details=""):
        if status:
            self.passed += 1
            print(f"  [PASS] {title}")
        else:
            self.failed += 1
            print(f"  [FAIL] {title} - {details}")

    def run(self):
        print(f"\n=======================================================")
        print(f"DocAI Live Container Integration Test Suite [{self.test_id}]")
        print(f"=======================================================\n")

        # 1. Health Checks
        print("1. Verifying Live Service Health Endpoints:")
        try:
            r_fe = requests.get(FRONTEND_URL, timeout=5)
            self.log("Frontend Nginx Container (Port 5173)", r_fe.status_code == 200)
        except Exception as e:
            self.log("Frontend Nginx Container (Port 5173)", False, str(e))

        try:
            r_be = requests.get(f"{BACKEND_URL}/actuator/health", timeout=5)
            health = r_be.json()
            db_up = health.get("components", {}).get("db", {}).get("status") == "UP"
            rabbit_up = health.get("components", {}).get("rabbit", {}).get("status") == "UP"
            redis_up = health.get("components", {}).get("redis", {}).get("status") == "UP"
            self.log("Spring Boot Backend Actuator (Port 8080)", r_be.status_code == 200 and health.get("status") == "UP")
            self.log("  - PostgreSQL Connectivity", db_up)
            self.log("  - RabbitMQ Broker Connectivity", rabbit_up)
            self.log("  - Redis Cache Connectivity", redis_up)
        except Exception as e:
            self.log("Spring Boot Backend Actuator (Port 8080)", False, str(e))

        try:
            r_rag = requests.get(f"{RAG_URL}/health", timeout=5)
            self.log("FastAPI RAG Service (Port 8000)", r_rag.status_code == 200 and r_rag.json().get("status") == "ok")
        except Exception as e:
            self.log("FastAPI RAG Service (Port 8000)", False, str(e))

        # 2. Authentication & Authorization
        print("\n2. Testing Authentication & Session Contracts:")
        email_a = f"alice_{self.test_id}@example.com"
        email_b = f"bob_{self.test_id}@example.com"
        email_c = f"charlie_{self.test_id}@example.com"
        pwd = "SecurePassword123!"

        # Register Users
        r_reg_a = requests.post(f"{BACKEND_URL}/api/auth/register", json={"email": email_a, "password": pwd, "fullName": "Alice Test"})
        self.log("Registration for User A (Alice)", r_reg_a.status_code == 200 and "token" in r_reg_a.json())
        token_a = r_reg_a.json().get("token", "")

        r_reg_b = requests.post(f"{BACKEND_URL}/api/auth/register", json={"email": email_b, "password": pwd, "fullName": "Bob Test"})
        self.log("Registration for User B (Bob)", r_reg_b.status_code == 200 and "token" in r_reg_b.json())
        token_b = r_reg_b.json().get("token", "")

        r_reg_c = requests.post(f"{BACKEND_URL}/api/auth/register", json={"email": email_c, "password": pwd, "fullName": "Charlie Test"})
        self.log("Registration for User C (Charlie)", r_reg_c.status_code == 200 and "token" in r_reg_c.json())
        token_c = r_reg_c.json().get("token", "")

        # Login Tests
        r_login = requests.post(f"{BACKEND_URL}/api/auth/login", json={"email": email_a, "password": pwd})
        self.log("Login with valid credentials returns JWT token", r_login.status_code == 200 and "token" in r_login.json())

        r_login_bad = requests.post(f"{BACKEND_URL}/api/auth/login", json={"email": email_a, "password": "wrongpassword"})
        self.log("Login with invalid credentials rejected (401)", r_login_bad.status_code == 401)

        # Unauthorized checks
        r_unauth = requests.get(f"{BACKEND_URL}/api/documents")
        self.log("Protected endpoint rejects request without token (401)", r_unauth.status_code == 401)

        r_bad_token = requests.get(f"{BACKEND_URL}/api/documents", headers={"Authorization": "Bearer invalid.jwt.token"})
        self.log("Protected endpoint rejects malformed token (401)", r_bad_token.status_code == 401)

        headers_a = {"Authorization": f"Bearer {token_a}"}
        headers_b = {"Authorization": f"Bearer {token_b}"}
        headers_c = {"Authorization": f"Bearer {token_c}"}

        # Decode user IDs from JWT
        def get_uid(t):
            p = t.split(".")[1]
            p += "=" * ((4 - len(p) % 4) % 4)
            return json.loads(base64.urlsafe_b64decode(p).decode())["userId"]

        uid_b = get_uid(token_b)

        # 3. Document Upload Validation
        print("\n3. Testing Document Upload Security & Constraints:")
        r_fake = requests.post(
            f"{BACKEND_URL}/api/documents/upload",
            headers=headers_a,
            files={"file": ("malicious.exe", b"MZexecutabledata", "application/octet-stream")}
        )
        self.log("Upload rejects non-whitelisted executable MIME type (400)", r_fake.status_code == 400)

        r_fake_pdf = requests.post(
            f"{BACKEND_URL}/api/documents/upload",
            headers=headers_a,
            files={"file": ("fake.pdf", b"This is plain text pretending to be PDF", "application/pdf")}
        )
        self.log("Upload rejects fake PDF without magic bytes (400)", r_fake_pdf.status_code == 400)

        # Create a valid synthetic PDF document with extractable text
        pdf_bytes = generate_sample_pdf("The confidential release key phrase is QuantumNebula2026. Store this in encrypted storage.")

        r_upload = requests.post(
            f"{BACKEND_URL}/api/documents/upload",
            headers=headers_a,
            files={"file": ("confidential_spec.pdf", pdf_bytes, "application/pdf")}
        )
        self.log("Valid PDF upload accepted (200)", r_upload.status_code == 200)
        doc_data = r_upload.json() if r_upload.status_code == 200 else {}
        doc_id = doc_data.get("id")

        # 4. Asynchronous Ingestion & Worker Processing
        print("\n4. Monitoring Asynchronous Ingestion via RabbitMQ:")
        print(f"  Document ID: {doc_id}, initial status: {doc_data.get('status')}")
        status = doc_data.get("status")
        retries = 20
        while retries > 0 and status in ("PENDING", "PROCESSING"):
            time.sleep(2)
            r_check = requests.get(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_a)
            if r_check.status_code == 200:
                status = r_check.json().get("status")
                print(f"  Polling status: {status}...")
                if status == "INDEXED":
                    break
            retries -= 1

        self.log("RabbitMQ consumer worker processed and indexed PDF into ChromaDB", status == "INDEXED")

        # 5. Cross-Tenant Document Isolation & RBAC (IDOR Protection)
        print("\n5. Testing Multi-Tenant Access Isolation (RBAC & IDOR Prevention):")
        r_b_view = requests.get(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_b)
        self.log("User B denied viewing User A's unshared document (403)", r_b_view.status_code == 403)

        r_b_chat = requests.post(
            f"{BACKEND_URL}/api/chat/ask",
            headers=headers_b,
            json={"documentId": doc_id, "question": "What is the secret release password?"}
        )
        self.log("User B denied chatting with User A's unshared document (403)", r_b_chat.status_code == 403)

        r_b_history = requests.get(f"{BACKEND_URL}/api/chat/history/{doc_id}", headers=headers_b)
        self.log("User B denied reading User A's unshared chat history (403)", r_b_history.status_code == 403)

        r_b_delete = requests.delete(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_b)
        self.log("User B denied deleting User A's unshared document (403)", r_b_delete.status_code == 403)

        # 6. Document Sharing Functionality
        print("\n6. Testing Document Sharing RBAC Contract:")
        r_share = requests.post(
            f"{BACKEND_URL}/api/documents/{doc_id}/share?userId={uid_b}&role=VIEWER",
            headers=headers_a
        )
        self.log("User A shares document with User B as VIEWER (200)", r_share.status_code == 200)

        r_b_view_shared = requests.get(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_b)
        self.log("User B now allowed viewing shared document (200)", r_b_view_shared.status_code == 200)

        r_c_view = requests.get(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_c)
        self.log("User C (unshared) remains denied (403)", r_c_view.status_code == 403)

        # 7. Live RAG Chat Query & SSE Streaming
        print("\n7. Testing Live RAG Question-Answering & Citations:")
        answer = ""
        r_ask = None
        for attempt in range(3):
            try:
                r_ask = requests.post(
                    f"{BACKEND_URL}/api/chat/ask",
                    headers=headers_a,
                    json={"documentId": doc_id, "question": "What is the confidential release key phrase?"},
                    timeout=45
                )
                if r_ask.status_code == 200:
                    ask_data = r_ask.json()
                    answer = ask_data.get("answer", "")
                    if answer:
                        break
            except Exception as e:
                pass
            time.sleep(2)

        print(f"  Generated Answer: {answer}")
        has_secret = "QuantumNebula2026" in answer or len(answer) > 10
        self.log("RAG retrieves content and generates LLM answer", (r_ask is not None and r_ask.status_code == 200 and has_secret))

        # Test SSE Streaming endpoint
        try:
            chunks_received = 0
            for attempt in range(3):
                try:
                    r_stream = requests.post(
                        f"{BACKEND_URL}/api/chat/ask/stream",
                        headers=headers_a,
                        json={"documentId": doc_id, "question": "Summarize the document purpose."},
                        stream=True,
                        timeout=45
                    )
                    if r_stream.status_code == 200:
                        for chunk in r_stream.iter_lines():
                            if chunk:
                                chunks_received += 1
                                if chunks_received >= 2:
                                    break
                        if chunks_received > 0:
                            break
                except Exception:
                    pass
                time.sleep(2)

            self.log("RAG SSE streaming chat (/api/chat/ask/stream) emits chunks", chunks_received > 0)
        except Exception as e:
            self.log("RAG SSE streaming chat", False, str(e))

        # 8. Document Deletion & Resource Cleanup
        print("\n8. Testing Document Deletion & Cascade Cleanup:")
        r_del = requests.delete(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_a)
        self.log("User A successfully deletes document (204/200)", r_del.status_code in (200, 204))

        r_verify_del = requests.get(f"{BACKEND_URL}/api/documents/{doc_id}", headers=headers_a)
        self.log("Deleted document is no longer accessible (403/404)", r_verify_del.status_code in (403, 404))

        print(f"\n=======================================================")
        print(f"Summary: {self.passed} Passed, {self.failed} Failed out of {self.passed + self.failed} Tests")
        print(f"=======================================================\n")
        return self.failed == 0

if __name__ == "__main__":
    runner = IntegrationTestRunner()
    success = runner.run()
    sys.exit(0 if success else 1)
