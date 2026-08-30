import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add server directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "server")))

from app.main import app
from app.database import init_db, SessionLocal
from app.models.models import User, Document, DocumentChunk
from app.services.auth_service import AuthService
from app.rag.vector_store import vector_store

client = TestClient(app)

# Global test state
state = {}


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Ensure clean test database & initial admin user."""
    init_db()
    db = SessionLocal()
    try:
        # Clean up any residual test users and docs
        db.query(User).filter(User.email.in_(["testadmin@college.edu", "arjun.patel@college.edu"])).delete(synchronize_session=False)
        db.query(Document).filter(Document.title == "Hostel Accommodations & Fee Regulations 2026").delete(synchronize_session=False)
        db.commit()

        # Create test admin
        admin = User(
            name="Test Admin",
            email="testadmin@college.edu",
            password_hash=AuthService.get_password_hash("AdminPass123!"),
            role="admin"
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()


def test_tc01_valid_registration():
    """TC01: Valid student registration."""
    payload = {
        "name": "Arjun Patel",
        "email": "arjun.patel@college.edu",
        "password": "Password123!",
        "role": "student"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "arjun.patel@college.edu"
    assert data["user"]["role"] == "student"
    state["student_token"] = data["access_token"]
    state["student_id"] = data["user"]["id"]


def test_tc02_invalid_login():
    """TC02: Invalid login credentials rejection."""
    payload = {
        "email": "arjun.patel@college.edu",
        "password": "WrongPasswordHere"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


def test_admin_login():
    """Obtain admin token for subsequent tests."""
    payload = {
        "email": "testadmin@college.edu",
        "password": "AdminPass123!"
    }
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 200
    state["admin_token"] = response.json()["access_token"]


def test_tc08_student_forbidden_admin_operation():
    """TC08: Student attempts admin operation -> 403 Forbidden."""
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    response = client.get("/api/admin/analytics", headers=headers)
    assert response.status_code == 403
    assert "Administrator access required" in response.json()["detail"]


def test_tc10_invalid_file_upload():
    """TC10: Upload unsupported file format -> 400 Bad Request."""
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    files = {"file": ("malicious_script.exe", b"binarycontent", "application/octet-stream")}
    data = {"title": "Bad File", "category": "General", "department": "All", "version": "1.0"}
    response = client.post("/api/documents/upload", headers=headers, files=files, data=data)
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"].lower()


def test_tc03_and_tc04_admin_uploads_and_ingests_document():
    """TC03 & TC04: Admin uploads college doc and verifies successful RAG ingestion."""
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    doc_content = b"""NATIONAL INSTITUTE OF ENGINEERING & TECHNOLOGY
HOSTEL ACCOMMODATIONS & FEE REGULATIONS 2026

1. HOSTEL ROOM FEES:
- Single Occupancy (Air Conditioned): Rs 75,000 per academic year.
- Triple Occupancy (Non-AC, Standard): Rs 45,000 per academic year.
Refundable Hostel Security Deposit is Rs 10,000.

2. MESS CHARGES:
Annual Mess Fee is Rs 42,000 per academic year covering 4 daily meals.
"""
    files = {"file": ("Hostel_Rules_Test.txt", doc_content, "text/plain")}
    data = {
        "title": "Hostel Accommodations & Fee Regulations 2026",
        "category": "Hostel",
        "department": "Student Welfare",
        "version": "1.0"
    }
    response = client.post("/api/documents/upload", headers=headers, files=files, data=data)
    assert response.status_code == 201
    doc_data = response.json()
    assert doc_data["title"] == "Hostel Accommodations & Fee Regulations 2026"
    assert doc_data["processing_status"] == "COMPLETED"
    state["test_doc_id"] = doc_data["id"]

    # Verify relational chunk records
    db = SessionLocal()
    try:
        chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_data["id"]).all()
        assert len(chunks) > 0
        assert chunks[0].page_number >= 1
    finally:
        db.close()


def test_tc05_known_question_and_tc11_source_inspection():
    """TC05 & TC11: Student asks known question -> Grounded response with exact page/source citation."""
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    payload = {
        "message": "What is the annual fee for triple occupancy non-AC hostel rooms?",
        "category": "Hostel"
    }
    response = client.post("/api/chat", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_grounded"] is True
    assert "45,000" in data["answer"] or "45000" in data["answer"] or "triple" in data["answer"].lower()
    assert len(data["sources"]) > 0
    assert data["sources"][0]["page_number"] >= 1
    assert "Hostel" in data["sources"][0]["document_title"]
    state["session_id"] = data["session_id"]
    state["message_id"] = data["message_id"]


def test_tc07_follow_up_question_context():
    """TC07: Student asks follow-up question -> Conversation context maintained."""
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    payload = {
        "message": "What about the annual mess fee?",
        "session_id": state["session_id"]
    }
    response = client.post("/api/chat", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == state["session_id"]
    assert "42,000" in data["answer"] or "42000" in data["answer"] or "mess" in data["answer"].lower()


def test_tc06_unknown_question_refusal():
    """TC06: Student asks unknown question outside knowledge base -> Safe refusal without hallucination."""
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    payload = {
        "message": "What is the tuition fee for the quantum teleportation department in year 2045?"
    }
    response = client.post("/api/chat", headers=headers, json=payload)
    assert response.status_code == 200
    data = response.json()
    answer_lower = data["answer"].lower()
    assert ("couldn't find information" in answer_lower or 
            "cannot find information" in answer_lower or 
            "not found" in answer_lower or
            data["is_grounded"] is False)


def test_feedback_submission():
    """Student rates the grounded answer with positive thumbs up."""
    headers = {"Authorization": f"Bearer {state['student_token']}"}
    payload = {
        "message_id": state["message_id"],
        "rating": 1,
        "comment": "Accurate hostel fee citation!"
    }
    response = client.post("/api/chat/feedback", headers=headers, json=payload)
    assert response.status_code == 200
    assert response.json()["rating"] == 1


def test_tc09_document_deletion_and_vector_cleanup():
    """TC09: Admin deletes document -> Document and vector records purged."""
    headers = {"Authorization": f"Bearer {state['admin_token']}"}
    doc_id = state["test_doc_id"]

    response = client.delete(f"/api/documents/{doc_id}", headers=headers)
    assert response.status_code == 200

    # Verify document no longer in database
    get_res = client.get(f"/api/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 404


def test_tc12_system_health():
    """TC12: System Health diagnostics endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("online", "degraded")
    assert data["database"]["status"] == "healthy"
    assert data["vector_database"]["status"] == "healthy"
