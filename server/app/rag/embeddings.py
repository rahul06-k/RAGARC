import math
import hashlib
import re
from typing import List
from app.config import settings


class EmbeddingProvider:
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

    def embed_query(self, text: str) -> List[float]:
        raise NotImplementedError


class SentenceTransformerEmbedding(EmbeddingProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except Exception as e:
                print(f"[EmbeddingProvider] SentenceTransformer failed to load: {e}. Falling back to FastDeterministicEmbedding.")
                self._model = FastDeterministicEmbedding()
        return self._model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        model = self._get_model()
        if isinstance(model, FastDeterministicEmbedding):
            return model.embed_documents(texts)
        embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
        return embeddings.tolist()

    def embed_query(self, text: str) -> List[float]:
        model = self._get_model()
        if isinstance(model, FastDeterministicEmbedding):
            return model.embed_query(text)
        embedding = model.encode([text], show_progress_bar=False, normalize_embeddings=True)[0]
        return embedding.tolist()


class GeminiEmbedding(EmbeddingProvider):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self._configured = False

    def _configure(self):
        if not self._configured:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._configured = True

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not self.api_key:
            return FastDeterministicEmbedding().embed_documents(texts)
        try:
            self._configure()
            import google.generativeai as genai
            results = []
            for text in texts:
                res = genai.embed_content(
                    model="models/embedding-001",
                    content=text,
                    task_type="retrieval_document"
                )
                results.append(res["embedding"])
            return results
        except Exception as e:
            print(f"[GeminiEmbedding] Error: {e}. Using FastDeterministic fallback.")
            return FastDeterministicEmbedding().embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        if not self.api_key:
            return FastDeterministicEmbedding().embed_query(text)
        try:
            self._configure()
            import google.generativeai as genai
            res = genai.embed_content(
                model="models/embedding-001",
                content=text,
                task_type="retrieval_query"
            )
            return res["embedding"]
        except Exception as e:
            print(f"[GeminiEmbedding] Error: {e}. Using FastDeterministic fallback.")
            return FastDeterministicEmbedding().embed_query(text)


class OpenAIEmbedding(EmbeddingProvider):
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self._client = None

    def _get_client(self):
        if self._client is None and self.api_key:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key)
        return self._client

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        client = self._get_client()
        if not client:
            return FastDeterministicEmbedding().embed_documents(texts)
        try:
            response = client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            print(f"[OpenAIEmbedding] Error: {e}. Using FastDeterministic fallback.")
            return FastDeterministicEmbedding().embed_documents(texts)

    def embed_query(self, text: str) -> List[float]:
        client = self._get_client()
        if not client:
            return FastDeterministicEmbedding().embed_query(text)
        try:
            response = client.embeddings.create(
                input=[text],
                model="text-embedding-3-small"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"[OpenAIEmbedding] Error: {e}. Using FastDeterministic fallback.")
            return FastDeterministicEmbedding().embed_query(text)


class FastDeterministicEmbedding(EmbeddingProvider):
    """
    High-speed deterministic 384-dimensional feature hashing embedder.
    Provides consistent vector distances and semantic keyword affinity without external weights.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def _hash_token(self, token: str) -> int:
        return int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16) % self.dim

    def embed_single(self, text: str) -> List[float]:
        tokens = re.findall(r'\b\w+\b', text.lower())
        vec = [0.0] * self.dim
        if not tokens:
            return vec

        for tok in tokens:
            idx = self._hash_token(tok)
            vec[idx] += 1.0

        # L2 normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_single(t) for t in texts]

    def embed_query(self, text: str) -> List[float]:
        return self.embed_single(text)


def get_embedding_provider() -> EmbeddingProvider:
    provider = settings.EMBEDDING_PROVIDER.lower()
    if provider == "gemini":
        return GeminiEmbedding()
    elif provider == "openai":
        return OpenAIEmbedding()
    elif provider == "sentence_transformers":
        return SentenceTransformerEmbedding(settings.EMBEDDING_MODEL_NAME)
    else:
        return SentenceTransformerEmbedding(settings.EMBEDDING_MODEL_NAME)
