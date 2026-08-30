import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.config import settings
from app.rag.vector_store import vector_store

router = APIRouter(tags=["Health"])

START_TIME = time.time()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """System health diagnostics endpoint."""
    uptime_seconds = round(time.time() - START_TIME, 1)

    # Check Relational Database
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check Vector Database
    vector_status = "healthy"
    vector_count = 0
    try:
        vector_count = vector_store.count()
    except Exception as e:
        vector_status = f"unhealthy: {str(e)}"

    return {
        "status": "online" if db_status == "healthy" and vector_status == "healthy" else "degraded",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "uptime_seconds": uptime_seconds,
        "database": {
            "status": db_status,
            "engine": "postgresql" if "postgresql" in settings.DATABASE_URL else "sqlite"
        },
        "vector_database": {
            "status": vector_status,
            "provider": "ChromaDB",
            "indexed_chunks": vector_count
        },
        "llm_provider": settings.LLM_PROVIDER,
        "embedding_provider": settings.EMBEDDING_PROVIDER
    }
