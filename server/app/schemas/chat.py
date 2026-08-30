from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SourceReference(BaseModel):
    document_id: int
    document_title: str
    filename: str
    page_number: int
    excerpt: str
    relevance_score: Optional[float] = None
    category: Optional[str] = None


class ChatQueryRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: Optional[str] = None
    category: Optional[str] = None
    department: Optional[str] = None


class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    question: str
    answer: str
    sources: List[SourceReference] = []
    is_grounded: bool = True
    latency: float = 0.0
    model: str = "gemini-1.5-flash"


class FeedbackRequest(BaseModel):
    message_id: str
    rating: int = Field(..., ge=-1, le=1)  # 1: thumbs up, -1: thumbs down
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: int
    message_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    model: Optional[str] = None
    latency: Optional[float] = None
    is_grounded: Optional[bool] = True
    sources: List[SourceReference] = []
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionSummary(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


class ChatSessionDetailResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True


class SuggestedQuestionsResponse(BaseModel):
    suggestions: List[str]
