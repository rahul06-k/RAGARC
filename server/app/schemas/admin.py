from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from app.schemas.auth import UserResponse


class CategoryStat(BaseModel):
    category: str
    count: int


class QueryStat(BaseModel):
    query: str
    count: int


class AdminAnalyticsResponse(BaseModel):
    total_documents: int
    processed_documents: int
    failed_documents: int
    pending_documents: int
    total_users: int
    total_questions: int
    total_sessions: int
    avg_response_time_ms: float
    popular_queries: List[QueryStat] = []
    unanswered_queries: List[QueryStat] = []
    feedback_stats: Dict[str, int] = {"positive": 0, "negative": 0}
    category_distribution: List[CategoryStat] = []


class AdminUserListItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    last_login: Optional[datetime] = None
    chat_sessions_count: int = 0
    documents_uploaded_count: int = 0

    class Config:
        from_attributes = True


class AdminUserListResponse(BaseModel):
    total: int
    users: List[AdminUserListItem]
