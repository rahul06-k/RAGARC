import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "CollegeAI Assistant"
    APP_ENV: str = "development"
    PORT: int = 8000
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite:///./college_rag.db"

    # JWT
    SECRET_KEY: str = "college-rag-super-secret-jwt-key-2026-production-ready-token"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # LLM Settings
    LLM_PROVIDER: str = "gemini"  # "gemini", "openai", "mock"
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    LLM_MODEL_NAME: str = "gemini-1.5-flash"

    # Embedding Settings
    EMBEDDING_PROVIDER: str = "sentence_transformers"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_data"
    CHROMA_COLLECTION_NAME: str = "college_documents"

    # Ingestion & RAG
    UPLOAD_DIR: str = "./uploaded_documents"
    MAX_FILE_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: str = "pdf,docx,txt"
    CHUNK_SIZE: int = 600
    CHUNK_OVERLAP: int = 100
    TOP_K_RETRIEVAL: int = 4
    SIMILARITY_THRESHOLD: float = 0.35

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower().lstrip(".") for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
