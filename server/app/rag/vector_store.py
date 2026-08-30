import json
from typing import List, Dict, Any, Optional
from app.vector.chroma_client import ChromaClientManager
from app.rag.chunker import ChunkItem
from app.config import settings


class VectorStore:
    def __init__(self):
        self._collection = None

    @property
    def collection(self):
        if self._collection is None:
            self._collection = ChromaClientManager.get_collection()
        return self._collection

    def add_chunks(
        self,
        chunks: List[ChunkItem],
        embeddings: List[List[float]]
    ) -> List[str]:
        """
        Store chunks and their embeddings into ChromaDB with rich metadata.
        """
        if not chunks:
            return []

        ids = []
        documents = []
        metadatas = []

        for chunk in chunks:
            vector_id = f"doc_{chunk.metadata.get('document_id')}_chunk_{chunk.chunk_index}"
            ids.append(vector_id)
            documents.append(chunk.text)
            
            # Chroma metadata values must be primitive types (str, int, float, bool)
            meta = {
                "document_id": int(chunk.metadata.get("document_id", 0)),
                "document_title": str(chunk.metadata.get("document_title", "")),
                "filename": str(chunk.metadata.get("filename", "")),
                "page_number": int(chunk.page_number),
                "chunk_index": int(chunk.chunk_index),
                "category": str(chunk.metadata.get("category", "General")),
                "department": str(chunk.metadata.get("department", "All")),
                "version": str(chunk.metadata.get("version", "1.0")),
                "status": str(chunk.metadata.get("status", "active")),
                "token_count": int(chunk.token_count)
            }
            metadatas.append(meta)

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        return ids

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 4,
        where_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search for top_k similar chunks.
        Returns a list of dicts with text, metadata, score, and id.
        """
        # Ensure only active documents are returned unless specified
        conditions = [{"status": "active"}]
        if where_filter:
            for k, v in where_filter.items():
                if k != "status" and v is not None and v != "" and v != "All":
                    conditions.append({k: v})

        if len(conditions) == 1:
            final_filter = conditions[0]
        else:
            final_filter = {"$and": conditions}

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, max(1, self.collection.count())),
            where=final_filter if self.collection.count() > 0 else None,
            include=["documents", "metadatas", "distances"]
        )

        hits = []
        if results and "ids" in results and results["ids"] and results["ids"][0]:
            ids = results["ids"][0]
            docs = results["documents"][0] if "documents" in results else []
            metas = results["metadatas"][0] if "metadatas" in results else []
            distances = results["distances"][0] if "distances" in results else []

            for i in range(len(ids)):
                # In Chroma with cosine distance: distance in [0, 2], similarity = 1 - (distance / 2) or 1 - distance
                dist = distances[i] if i < len(distances) else 1.0
                similarity_score = max(0.0, min(1.0, 1.0 - (dist / 2.0)))
                
                hits.append({
                    "id": ids[i],
                    "text": docs[i] if i < len(docs) else "",
                    "metadata": metas[i] if i < len(metas) else {},
                    "score": round(similarity_score, 4),
                    "distance": dist
                })

        return hits

    def delete_by_document_id(self, document_id: int):
        """Delete all chunks associated with a document ID."""
        try:
            self.collection.delete(
                where={"document_id": int(document_id)}
            )
        except Exception as e:
            print(f"[VectorStore] Error deleting vectors for doc {document_id}: {e}")

    def count(self) -> int:
        try:
            return self.collection.count()
        except Exception:
            return 0


vector_store = VectorStore()
