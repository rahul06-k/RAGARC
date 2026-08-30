from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.models import Document, User, ChatSession, Message, RetrievalLog, Feedback
from app.schemas.admin import AdminAnalyticsResponse, QueryStat, CategoryStat, AdminUserListItem


class AdminService:
    @staticmethod
    def get_analytics(db: Session) -> AdminAnalyticsResponse:
        total_docs = db.query(Document).count()
        processed_docs = db.query(Document).filter(Document.processing_status == "COMPLETED").count()
        failed_docs = db.query(Document).filter(Document.processing_status == "FAILED").count()
        pending_docs = db.query(Document).filter(Document.processing_status.in_(["PENDING", "PROCESSING"])).count()

        total_users = db.query(User).count()
        total_sessions = db.query(ChatSession).count()
        total_questions = db.query(Message).filter(Message.role == "user").count()

        # Average latency
        avg_lat_res = db.query(func.avg(Message.latency)).filter(Message.role == "assistant").scalar()
        avg_latency_ms = round((avg_lat_res or 0.0) * 1000, 1)

        # Category distribution
        cat_counts = (
            db.query(Document.category, func.count(Document.id))
            .group_by(Document.category)
            .all()
        )
        category_distribution = [CategoryStat(category=cat or "General", count=cnt) for cat, cnt in cat_counts]

        # Popular queries
        popular_raw = (
            db.query(RetrievalLog.query, func.count(RetrievalLog.id).label("q_count"))
            .group_by(RetrievalLog.query)
            .order_by(desc("q_count"))
            .limit(5)
            .all()
        )
        popular_queries = [QueryStat(query=q, count=c) for q, c in popular_raw]

        # Unanswered queries (grounding = False)
        unanswered_raw = (
            db.query(Message.content, func.count(Message.id).label("u_count"))
            .filter(Message.role == "user")
            .join(ChatSession, Message.session_id == ChatSession.id)
            .order_by(desc("u_count"))
            .limit(5)
            .all()
        )
        unanswered_queries = [QueryStat(query=u, count=c) for u, c in unanswered_raw]

        # Feedback stats
        pos_fb = db.query(Feedback).filter(Feedback.rating > 0).count()
        neg_fb = db.query(Feedback).filter(Feedback.rating < 0).count()

        return AdminAnalyticsResponse(
            total_documents=total_docs,
            processed_documents=processed_docs,
            failed_documents=failed_docs,
            pending_documents=pending_docs,
            total_users=total_users,
            total_questions=total_questions,
            total_sessions=total_sessions,
            avg_response_time_ms=avg_latency_ms,
            popular_queries=popular_queries,
            unanswered_queries=unanswered_queries,
            feedback_stats={"positive": pos_fb, "negative": neg_fb},
            category_distribution=category_distribution
        )

    @staticmethod
    def get_users_list(db: Session, skip: int = 0, limit: int = 50) -> tuple[List[AdminUserListItem], int]:
        total = db.query(User).count()
        users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()

        user_items = []
        for u in users:
            sessions_count = db.query(ChatSession).filter(ChatSession.user_id == u.id).count()
            docs_count = db.query(Document).filter(Document.uploaded_by == u.id).count()
            user_items.append(
                AdminUserListItem(
                    id=u.id,
                    name=u.name,
                    email=u.email,
                    role=u.role,
                    created_at=u.created_at,
                    last_login=u.last_login,
                    chat_sessions_count=sessions_count,
                    documents_uploaded_count=docs_count
                )
            )

        return user_items, total

    @staticmethod
    def update_user_role(db: Session, user_id: int, new_role: str) -> Optional[User]:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        user.role = new_role
        db.commit()
        db.refresh(user)
        return user
