import re
from typing import List, Dict, Any


class RelevanceReranker:
    """
    Reranks retrieved candidate chunks using term overlap, proximity, and title matching.
    """
    @staticmethod
    def rerank(
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        if not candidates:
            return []

        query_terms = set(re.findall(r'\b\w{3,}\b', query.lower()))
        if not query_terms:
            return candidates[:top_k]

        scored_candidates = []
        for item in candidates:
            text = item.get("text", "").lower()
            meta = item.get("metadata", {})
            title = str(meta.get("document_title", "")).lower()
            base_score = float(item.get("score", 0.5))

            # Term overlap score
            term_matches = sum(1 for term in query_terms if term in text)
            title_matches = sum(1 for term in query_terms if term in title)

            overlap_ratio = term_matches / len(query_terms) if query_terms else 0.0
            boost = (overlap_ratio * 0.3) + (0.15 * min(1.0, title_matches))

            final_score = min(1.0, base_score + boost)
            
            scored_item = dict(item)
            scored_item["score"] = round(final_score, 4)
            scored_candidates.append((final_score, scored_item))

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        return [item for _, item in scored_candidates[:top_k]]
