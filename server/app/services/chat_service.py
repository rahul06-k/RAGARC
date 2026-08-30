import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.models import ChatSession, Message, RetrievalLog, Feedback, Document
from app.schemas.chat import (
    ChatQueryRequest, ChatResponse, SourceReference,
    ChatMessageResponse, ChatSessionSummary, ChatSessionDetailResponse
)
from app.rag.retriever import retriever
from app.rag.generator import get_llm_generator


class ChatService:
    @staticmethod
    def get_or_create_session(db: Session, user_id: int, session_id: Optional[str] = None, initial_title: str = "New Conversation") -> ChatSession:
        if session_id:
            session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
            if session:
                return session

        new_session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=initial_title[:100],
            created_at=datetime.utcnow()
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        return new_session

    @staticmethod
    def process_query(
        db: Session,
        user_id: int,
        query_data: ChatQueryRequest
    ) -> ChatResponse:
        """
        Executes the student question answering workflow:
        1. Resolve/Create ChatSession
        2. Fetch past conversation turns for follow-up context
        3. Retrieve relevant chunks via ChromaDB + Re-ranker
        4. Query LLM (Gemini / OpenAI / Heuristic fallback)
        5. Format and record sources
        6. Persist Messages & RetrievalLogs
        """
        question = query_data.message.strip()

        # 1. Resolve Session
        title_summary = question if len(question) <= 45 else question[:42] + "..."
        session = ChatService.get_or_create_session(db, user_id, query_data.session_id, initial_title=title_summary)

        # 2. Fetch recent conversation history
        recent_messages = (
            db.query(Message)
            .filter(Message.session_id == session.id)
            .order_by(Message.created_at.desc())
            .limit(6)
            .all()
        )
        history = [{"role": m.role, "content": m.content} for m in reversed(recent_messages)]

        # 3. Setup retrieval filters if supplied
        filters = {}
        if query_data.category and query_data.category != "All":
            filters["category"] = query_data.category
        if query_data.department and query_data.department != "All":
            filters["department"] = query_data.department

        # 4. Perform Semantic Retrieval
        retrieved_chunks = retriever.retrieve(question, filters=filters if filters else None)

        # 5. LLM Grounded Generation
        generator = get_llm_generator()
        answer, is_grounded, latency, model_name = generator.generate_answer(
            question=question,
            retrieved_chunks=retrieved_chunks,
            conversation_history=history
        )

        # 6. Format Source References
        sources: List[SourceReference] = []
        if is_grounded and retrieved_chunks:
            sources = retriever.format_source_references(retrieved_chunks)

        # 7. Persist User Message
        user_msg = Message(
            id=str(uuid.uuid4()),
            session_id=session.id,
            role="user",
            content=question,
            model=model_name,
            latency=0.0,
            is_grounded=True,
            sources_json="[]",
            created_at=datetime.utcnow()
        )
        db.add(user_msg)

        # 8. Persist Assistant Message
        sources_payload = [s.model_dump() for s in sources]
        assistant_msg = Message(
            id=str(uuid.uuid4()),
            session_id=session.id,
            role="assistant",
            content=answer,
            model=model_name,
            latency=latency,
            is_grounded=is_grounded,
            sources_json=json.dumps(sources_payload),
            created_at=datetime.utcnow()
        )
        db.add(assistant_msg)

        # 9. Persist Retrieval Log
        retrieval_log = RetrievalLog(
            message_id=assistant_msg.id,
            query=question,
            retrieved_chunk_ids=json.dumps([c.get("id", "") for c in retrieved_chunks]),
            retrieval_scores=json.dumps([c.get("score", 0.0) for c in retrieved_chunks]),
            metadata_filters=json.dumps(filters),
            created_at=datetime.utcnow()
        )
        db.add(retrieval_log)

        # Update session timestamp & title if first message
        session.updated_at = datetime.utcnow()
        if session.title == "New Conversation":
            session.title = title_summary

        db.commit()

        return ChatResponse(
            session_id=session.id,
            message_id=assistant_msg.id,
            question=question,
            answer=answer,
            sources=sources,
            is_grounded=is_grounded,
            latency=latency,
            model=model_name
        )

    @staticmethod
    def list_user_sessions(db: Session, user_id: int) -> List[ChatSessionSummary]:
        sessions = (
            db.query(ChatSession)
            .filter(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
            .all()
        )
        summaries = []
        for s in sessions:
            msg_count = db.query(Message).filter(Message.session_id == s.id).count()
            summaries.append(
                ChatSessionSummary(
                    id=s.id,
                    title=s.title,
                    created_at=s.created_at,
                    updated_at=s.updated_at,
                    message_count=msg_count
                )
            )
        return summaries

    @staticmethod
    def get_session_detail(db: Session, session_id: str, user_id: int) -> Optional[ChatSessionDetailResponse]:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
        if not session:
            return None

        messages = db.query(Message).filter(Message.session_id == session.id).order_by(Message.created_at.asc()).all()
        message_dtos = []
        for m in messages:
            sources_list = []
            try:
                if m.sources_json:
                    parsed = json.loads(m.sources_json)
                    sources_list = [SourceReference(**item) for item in parsed]
            except Exception:
                sources_list = []

            message_dtos.append(
                ChatMessageResponse(
                    id=m.id,
                    role=m.role,
                    content=m.content,
                    model=m.model,
                    latency=m.latency,
                    is_grounded=m.is_grounded,
                    sources=sources_list,
                    created_at=m.created_at
                )
            )

        return ChatSessionDetailResponse(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            messages=message_dtos
        )

    @staticmethod
    def delete_session(db: Session, session_id: str, user_id: int) -> bool:
        session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()
        if not session:
            return False
        db.delete(session)
        db.commit()
        return True

    @staticmethod
    def record_feedback(db: Session, user_id: int, message_id: str, rating: int, comment: Optional[str] = None) -> Feedback:
        feedback = Feedback(
            message_id=message_id,
            user_id=user_id,
            rating=rating,
            comment=comment,
            created_at=datetime.utcnow()
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback

    @staticmethod
    def get_suggested_questions(db: Session) -> List[str]:
        # Return intelligent suggested questions based on categories
        return [
            "What is the eligibility criteria for B.Tech Admissions?",
            "What are the hostel fees and room options for first-year students?",
            "What is the minimum attendance requirement for semester examinations?",
            "What is the placement policy for dream companies?",
            "What are the library operating hours and borrowing limits?",
            "How can I apply for merit-based scholarships?"
        ]
