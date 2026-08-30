from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import User
from app.schemas.chat import (
    ChatQueryRequest, ChatResponse, ChatSessionSummary,
    ChatSessionDetailResponse, FeedbackRequest, FeedbackResponse,
    SuggestedQuestionsResponse
)
from app.services.auth_service import get_current_user
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat & RAG"])


@router.post("", response_model=ChatResponse)
def submit_question(
    query_data: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a student's question to the RAG pipeline.
    Performs retrieval, generates grounded response, stores history, and returns citations.
    """
    return ChatService.process_query(db, current_user.id, query_data)


@router.get("/sessions", response_model=List[ChatSessionSummary])
def get_user_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all conversations belonging to the authenticated student."""
    return ChatService.list_user_sessions(db, current_user.id)


@router.get("/sessions/{session_id}", response_model=ChatSessionDetailResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a full conversation with all messages and source citations."""
    session_detail = ChatService.get_session_detail(db, session_id, current_user.id)
    if not session_detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )
    return session_detail


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation session."""
    deleted = ChatService.delete_session(db, session_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found or access denied."
        )
    return {"message": "Conversation successfully deleted."}


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(
    feedback_data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit rating and feedback for an AI response."""
    feedback = ChatService.record_feedback(
        db,
        current_user.id,
        feedback_data.message_id,
        feedback_data.rating,
        feedback_data.comment
    )
    return FeedbackResponse.model_validate(feedback)


@router.get("/suggestions", response_model=SuggestedQuestionsResponse)
def get_suggested_questions(db: Session = Depends(get_db)):
    """Retrieve sample suggested student questions."""
    suggestions = ChatService.get_suggested_questions(db)
    return SuggestedQuestionsResponse(suggestions=suggestions)
