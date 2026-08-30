from typing import List, Dict, Any, Optional
from app.rag.embeddings import get_embedding_provider
from app.rag.vector_store import vector_store
from app.rag.reranker import RelevanceReranker
from app.schemas.chat import SourceReference
from app.config import settings


class SemanticRetriever:
    def __init__(self):
        self.embedding_provider = get_embedding_provider()
        self.vector_store = vector_store

    def retrieve(
        self,
        query: str,
        top_k: int = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant chunks for a given query, applies optional filters and re-ranking.
        """
        top_k = top_k or settings.TOP_K_RETRIEVAL

        # 1. Generate query embedding
        query_embedding = self.embedding_provider.embed_query(query)

        # 2. Vector search in ChromaDB (retrieve 2x top_k for re-ranking)
        candidates = self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k * 2,
            where_filter=filters
        )

        if not candidates:
            return []

        # 3. Apply Re-ranking
        reranked = RelevanceReranker.rerank(query, candidates, top_k=top_k)

        return reranked

    def format_source_references(self, retrieved_chunks: List[Dict[str, Any]]) -> List[SourceReference]:
        """Convert retrieved chunks into clean SourceReference objects."""
        sources = []
        seen = set()

        for chunk in retrieved_chunks:
            meta = chunk.get("metadata", {})
            doc_id = int(meta.get("document_id", 0))
            page_num = int(meta.get("page_number", 1))
            key = (doc_id, page_num)

            # Extract snippet excerpt
            raw_text = chunk.get("text", "").strip()
            excerpt = raw_text[:280] + ("..." if len(raw_text) > 280 else "")

            # Avoid exact duplicate source cards for the same document page
            if key not in seen:
                seen.add(key)
                sources.append(
                    SourceReference(
                        document_id=doc_id,
                        document_title=str(meta.get("document_title", meta.get("filename", "College Document"))),
                        filename=str(meta.get("filename", "")),
                        page_number=page_num,
                        excerpt=excerpt,
                        relevance_score=float(chunk.get("score", 0.0)),
                        category=str(meta.get("category", "General"))
                    )
                )

        return sources


retriever = SemanticRetriever()
