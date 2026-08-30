from fastapi import APIRouter
from .auth import router as auth_router
from .chat import router as chat_router
from .documents import router as documents_router
from .admin import router as admin_router
from .health import router as health_router

api_router = APIRouter(prefix="/api")
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(documents_router)
api_router.include_router(admin_router)

__all__ = ["api_router"]
