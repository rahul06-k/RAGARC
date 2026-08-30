import os
import shutil
from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.models.models import User, Document
from app.services.auth_service import AuthService
from app.services.document_service import DocumentService
from app.schemas.documents import DocumentCreate
from app.config import settings


def seed_database():
    print("=== [CollegeAI] Starting Database Seeding ===")
    init_db()
    db: Session = SessionLocal()

    try:
        # 1. Seed Admin User
        admin_email = "admin@college.edu"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                name="System Administrator",
                email=admin_email,
                password_hash=AuthService.get_password_hash("Admin@123"),
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"[Seed] Created Admin: {admin_email} (Password: Admin@123)")
        else:
            print(f"[Seed] Admin already exists: {admin_email}")

        # 2. Seed Student User
        student_email = "student@college.edu"
        student = db.query(User).filter(User.email == student_email).first()
        if not student:
            student = User(
                name="Rahul Sharma",
                email=student_email,
                password_hash=AuthService.get_password_hash("Student@123"),
                role="student"
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            print(f"[Seed] Created Student: {student_email} (Password: Student@123)")
        else:
            print(f"[Seed] Student already exists: {student_email}")

        # 3. Seed Sample Documents
        sample_docs_info = [
            {
                "file": "Admissions_Brochure_2026.txt",
                "title": "B.Tech Admissions & Fee Structure 2026",
                "category": "Admissions",
                "department": "Admissions Cell",
                "version": "1.0"
            },
            {
                "file": "Hostel_Fee_Structure_2026.txt",
                "title": "Hostel Accommodations & Fee Regulations 2026",
                "category": "Hostel",
                "department": "Student Welfare",
                "version": "1.0"
            },
            {
                "file": "Examination_and_Grading_Rules.txt",
                "title": "Academic Evaluation & Examination Regulations",
                "category": "Academics",
                "department": "Examination Branch",
                "version": "1.0"
            },
            {
                "file": "Campus_Placement_Policy_2026.txt",
                "title": "Campus Recruitment & Placement Policy 2026",
                "category": "Placement",
                "department": "Training & Placement Cell",
                "version": "1.0"
            }
        ]

        sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "sample_documents"))
        upload_dir = os.path.abspath(settings.UPLOAD_DIR)
        os.makedirs(upload_dir, exist_ok=True)

        for doc_info in sample_docs_info:
            src_path = os.path.join(sample_dir, doc_info["file"])
            if not os.path.exists(src_path):
                print(f"[Seed] Warning: Sample document {src_path} not found.")
                continue

            # Check if document already exists
            existing_doc = db.query(Document).filter(Document.title == doc_info["title"]).first()
            if existing_doc:
                print(f"[Seed] Document already ingested: '{doc_info['title']}'")
                continue

            dest_filename = f"seed_{doc_info['file']}"
            dest_path = os.path.join(upload_dir, dest_filename)
            shutil.copyfile(src_path, dest_path)
            file_size = os.path.getsize(dest_path)

            meta = DocumentCreate(
                title=doc_info["title"],
                category=doc_info["category"],
                department=doc_info["department"],
                version=doc_info["version"]
            )

            created = DocumentService.create_document(
                db=db,
                file_path=dest_path,
                filename=doc_info["file"],
                file_size=file_size,
                uploader_id=admin.id,
                metadata=meta
            )
            print(f"[Seed] Ingested '{created.title}' (Status: {created.processing_status})")

        print("=== [CollegeAI] Seeding Completed Successfully! ===")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
