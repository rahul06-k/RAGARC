from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    category: Optional[str] = "General"
    department: Optional[str] = "All"
    version: Optional[str] = "1.0"


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None
    version: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive)$")


class DocumentResponse(BaseModel):
    id: int
    filename: str
    title: str
    category: str
    department: str
    version: str
    status: str
    uploaded_by: int
    uploader_name: Optional[str] = None
    page_count: int
    file_size: int
    processing_status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    total: int
    items: List[DocumentResponse]


class DocumentSourceResponse(BaseModel):
    id: int
    filename: str
    title: str
    page_count: int
    storage_path: str
    category: str
    department: str
