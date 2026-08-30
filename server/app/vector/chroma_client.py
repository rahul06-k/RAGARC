import os
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings


class ChromaClientManager:
    _instance = None
    _client = None
    _collection = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            persist_dir = os.path.abspath(settings.CHROMA_PERSIST_DIR)
            os.makedirs(persist_dir, exist_ok=True)
            cls._client = chromadb.PersistentClient(
                path=persist_dir,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        return cls._client

    @classmethod
    def get_collection(cls):
        if cls._collection is None:
            client = cls.get_client()
            cls._collection = client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
        return cls._collection

    @classmethod
    def reset_collection(cls):
        client = cls.get_client()
        try:
            client.delete_collection(settings.CHROMA_COLLECTION_NAME)
        except Exception:
            pass
        cls._collection = client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
        return cls._collection
