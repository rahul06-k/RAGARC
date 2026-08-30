import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.documents import (
    DocumentCreate, DocumentUpdate, DocumentResponse,
    DocumentListResponse, DocumentSourceResponse
)
from app.services.auth_service import get_current_user, require_admin
from app.services.storage_service import StorageService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Document Management"])


@router.get("", response_model=DocumentListResponse)
def list_documents(
    search: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve college documents with search, categorization, and department filters."""
    docs, total = DocumentService.list_documents(
        db=db,
        search=search,
        category=category,
        department=department,
        status=status_filter,
        skip=skip,
        limit=limit
    )

    doc_responses = []
    for d in docs:
        resp = DocumentResponse.model_validate(d)
        if d.uploader:
            resp.uploader_name = d.uploader.name
        doc_responses.append(resp)

    return DocumentListResponse(total=total, items=doc_responses)


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: Optional[str] = Form("General"),
    department: Optional[str] = Form("All"),
    version: Optional[str] = Form("1.0"),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator uploads a document (PDF, DOCX, TXT).
    Triggers validation, extraction, chunking, embedding, and vector storage.
    """
    saved_path, original_filename, file_size = StorageService.save_upload_file(file)

    meta = DocumentCreate(
        title=title,
        category=category or "General",
        department=department or "All",
        version=version or "1.0"
    )

    doc = DocumentService.create_document(
        db=db,
        file_path=saved_path,
        filename=original_filename,
        file_size=file_size,
        uploader_id=current_admin.id,
        metadata=meta
    )

    resp = DocumentResponse.model_validate(doc)
    resp.uploader_name = current_admin.name
    return resp


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve metadata and processing status for a single document."""
    doc = DocumentService.get_document(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )
    resp = DocumentResponse.model_validate(doc)
    if doc.uploader:
        resp.uploader_name = doc.uploader.name
    return resp


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(
    document_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Re-extract, re-chunk, generate embeddings, and re-index a document."""
    doc = DocumentService.reprocess_document(db, document_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )
    resp = DocumentResponse.model_validate(doc)
    if doc.uploader:
        resp.uploader_name = doc.uploader.name
    return resp


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document_metadata(
    document_id: int,
    update_data: DocumentUpdate,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update title, category, department, version, or active status."""
    doc = DocumentService.update_document(db, document_id, update_data, current_admin.id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )
    resp = DocumentResponse.model_validate(doc)
    if doc.uploader:
        resp.uploader_name = doc.uploader.name
    return resp


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Deletes a document and purges all associated vector database embeddings."""
    success = DocumentService.delete_document(db, document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID {document_id} not found."
        )
    return {"message": "Document and associated vector records deleted successfully."}


@router.get("/{document_id}/source")
def get_document_source(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Serves the raw document file for in-browser viewing or download."""
    doc = DocumentService.get_document(db, document_id)
    if not doc or not os.path.exists(doc.storage_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document source file not found."
        )

    # Determine media type
    ext = os.path.splitext(doc.filename)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "application/octet-stream"
    if ext == ".docx":
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif ext == ".txt":
        media_type = "text/plain"

    return FileResponse(
        path=doc.storage_path,
        filename=doc.filename,
        media_type=media_type
    )
