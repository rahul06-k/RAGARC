import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.models import Document, DocumentChunk, DocumentVersion, User
from app.schemas.documents import DocumentCreate, DocumentUpdate
from app.rag.loaders import DocumentLoader
from app.rag.chunker import TextChunker
from app.rag.embeddings import get_embedding_provider
from app.rag.vector_store import vector_store
from app.services.storage_service import StorageService
from app.config import settings


class DocumentService:
    @staticmethod
    def process_document(db: Session, document_id: int):
        """
        Executes the end-to-end ingestion pipeline:
        Validation -> Text Extraction -> Page Preservation -> Chunking -> Embedding -> ChromaDB Indexing.
        """
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return

        doc.processing_status = "PROCESSING"
        doc.error_message = None
        db.commit()

        try:
            # 1. Text Extraction with Page Preservation
            pages, total_pages = DocumentLoader.load(doc.storage_path)
            doc.page_count = total_pages

            if not pages:
                raise ValueError("No extractable text found in the document.")

            # 2. Document Chunking
            chunker = TextChunker(
                chunk_size=settings.CHUNK_SIZE,
                chunk_overlap=settings.CHUNK_OVERLAP
            )
            metadata = {
                "document_id": doc.id,
                "document_title": doc.title,
                "filename": doc.filename,
                "category": doc.category,
                "department": doc.department,
                "version": doc.version,
                "status": doc.status
            }
            chunks = chunker.split_pages_into_chunks(pages, doc.id, metadata)

            if not chunks:
                raise ValueError("Document chunking produced 0 chunks.")

            # 3. Clean up existing chunks & vectors if reprocessing
            vector_store.delete_by_document_id(doc.id)
            db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()

            # 4. Generate Numerical Embeddings
            embedder = get_embedding_provider()
            chunk_texts = [c.text for c in chunks]
            embeddings = embedder.embed_documents(chunk_texts)

            # 5. Store in ChromaDB Vector Database
            vector_ids = vector_store.add_chunks(chunks, embeddings)

            # 6. Save Chunk records in Relational Database
            for i, chunk in enumerate(chunks):
                v_id = vector_ids[i] if i < len(vector_ids) else f"doc_{doc.id}_chunk_{chunk.chunk_index}"
                chunk_row = DocumentChunk(
                    document_id=doc.id,
                    chunk_index=chunk.chunk_index,
                    page_number=chunk.page_number,
                    chunk_text=chunk.text,
                    token_count=chunk.token_count,
                    vector_id=v_id,
                    chunk_metadata=json.dumps(chunk.metadata),
                    created_at=datetime.utcnow()
                )
                db.add(chunk_row)

            doc.processing_status = "COMPLETED"
            doc.error_message = None
            db.commit()
            print(f"[DocumentService] Successfully ingested document '{doc.title}' ({len(chunks)} chunks, {total_pages} pages).")

        except Exception as e:
            db.rollback()
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.processing_status = "FAILED"
                doc.error_message = str(e)
                db.commit()
            print(f"[DocumentService] Ingestion failed for document {document_id}: {e}")

    @staticmethod
    def create_document(
        db: Session,
        file_path: str,
        filename: str,
        file_size: int,
        uploader_id: int,
        metadata: DocumentCreate
    ) -> Document:
        new_doc = Document(
            filename=filename,
            title=metadata.title.strip(),
            category=metadata.category or "General",
            department=metadata.department or "All",
            version=metadata.version or "1.0",
            status="active",
            uploaded_by=uploader_id,
            storage_path=file_path,
            file_size=file_size,
            processing_status="PENDING",
            created_at=datetime.utcnow()
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        # Record initial version
        doc_version = DocumentVersion(
            document_id=new_doc.id,
            version=new_doc.version,
            status="active",
            created_by=uploader_id
        )
        db.add(doc_version)
        db.commit()

        # Ingest synchronously or in background
        DocumentService.process_document(db, new_doc.id)
        db.refresh(new_doc)
        return new_doc

    @staticmethod
    def list_documents(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> tuple[List[Document], int]:
        query = db.query(Document)

        if search:
            search_filter = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Document.title.ilike(search_filter),
                    Document.filename.ilike(search_filter)
                )
            )

        if category and category != "All":
            query = query.filter(Document.category == category)

        if department and department != "All":
            query = query.filter(Document.department == department)

        if status and status != "All":
            query = query.filter(Document.status == status)

        total = query.count()
        docs = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
        return docs, total

    @staticmethod
    def get_document(db: Session, document_id: int) -> Optional[Document]:
        return db.query(Document).filter(Document.id == document_id).first()

    @staticmethod
    def update_document(
        db: Session,
        document_id: int,
        update_data: DocumentUpdate,
        user_id: int
    ) -> Optional[Document]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return None

        version_changed = False
        if update_data.title is not None:
            doc.title = update_data.title.strip()
        if update_data.category is not None:
            doc.category = update_data.category
        if update_data.department is not None:
            doc.department = update_data.department
        if update_data.status is not None:
            doc.status = update_data.status
        if update_data.version is not None and update_data.version != doc.version:
            doc.version = update_data.version
            version_changed = True

        doc.updated_at = datetime.utcnow()

        if version_changed:
            new_v = DocumentVersion(
                document_id=doc.id,
                version=doc.version,
                status=doc.status,
                created_by=user_id
            )
            db.add(new_v)

        db.commit()
        db.refresh(doc)
        
        # Reprocess if metadata changed to synchronize ChromaDB metadata
        DocumentService.process_document(db, doc.id)
        db.refresh(doc)
        return doc

    @staticmethod
    def delete_document(db: Session, document_id: int) -> bool:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return False

        # 1. Purge from ChromaDB
        vector_store.delete_by_document_id(doc.id)

        # 2. Delete physical file
        StorageService.delete_file(doc.storage_path)

        # 3. Delete from DB (cascades to chunks and versions)
        db.delete(doc)
        db.commit()
        return True

    @staticmethod
    def reprocess_document(db: Session, document_id: int) -> Optional[Document]:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            return None
        DocumentService.process_document(db, doc.id)
        db.refresh(doc)
        return doc
