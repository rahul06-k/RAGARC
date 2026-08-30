import re
from typing import List, Dict, Any
from app.rag.loaders import DocumentPage


class ChunkItem:
    def __init__(
        self,
        chunk_index: int,
        page_number: int,
        text: str,
        token_count: int,
        metadata: Dict[str, Any] = None
    ):
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.text = text
        self.token_count = token_count
        self.metadata = metadata or {}


class TextChunker:
    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100):
        """
        chunk_size: approximate target token count (1 token ≈ 4 characters)
        chunk_overlap: approximate overlap token count
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.char_size = chunk_size * 4
        self.char_overlap = chunk_overlap * 4

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count (approx. words * 1.3 or chars / 4)."""
        words = len(text.split())
        return max(1, int(words * 1.3))

    def split_pages_into_chunks(
        self,
        pages: List[DocumentPage],
        document_id: int,
        doc_metadata: Dict[str, Any] = None
    ) -> List[ChunkItem]:
        """
        Splits a list of DocumentPage objects into chunks while preserving page numbers.
        """
        chunks = []
        global_chunk_idx = 0
        doc_metadata = doc_metadata or {}

        for page in pages:
            page_text = page.text.strip()
            if not page_text:
                continue

            page_chunks = self._chunk_text(page_text)
            for text_chunk in page_chunks:
                if not text_chunk.strip():
                    continue
                
                tok_count = self.estimate_tokens(text_chunk)
                meta = {
                    **doc_metadata,
                    "document_id": document_id,
                    "page_number": page.page_number,
                    "chunk_index": global_chunk_idx,
                    "token_count": tok_count
                }
                
                chunks.append(
                    ChunkItem(
                        chunk_index=global_chunk_idx,
                        page_number=page.page_number,
                        text=text_chunk,
                        token_count=tok_count,
                        metadata=meta
                    )
                )
                global_chunk_idx += 1

        return chunks

    def _chunk_text(self, text: str) -> List[str]:
        """Recursive paragraph and sentence-aware chunking."""
        if len(text) <= self.char_size:
            return [text]

        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_length = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_len = len(para)
            if current_length + para_len + 2 <= self.char_size:
                current_chunk.append(para)
                current_length += para_len + 2
            else:
                if current_chunk:
                    chunk_str = "\n\n".join(current_chunk)
                    chunks.append(chunk_str)
                    # Handle overlap
                    overlap_chars = 0
                    overlap_paras = []
                    for p in reversed(current_chunk):
                        if overlap_chars + len(p) <= self.char_overlap:
                            overlap_paras.insert(0, p)
                            overlap_chars += len(p)
                        else:
                            break
                    current_chunk = overlap_paras
                    current_length = sum(len(p) + 2 for p in current_chunk)

                # If a single paragraph is too large, split by sentences
                if para_len > self.char_size:
                    sentence_chunks = self._split_by_sentences(para)
                    for sc in sentence_chunks:
                        chunks.append(sc)
                    current_chunk = []
                    current_length = 0
                else:
                    current_chunk.append(para)
                    current_length += para_len + 2

        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks

    def _split_by_sentences(self, text: str) -> List[str]:
        """Split text by sentences when paragraph is larger than chunk size."""
        sentences = re.split(r'(?<=[.!?])\s+', text)
        result = []
        cur = []
        cur_len = 0

        for s in sentences:
            s = s.strip()
            if not s:
                continue
            if cur_len + len(s) + 1 <= self.char_size:
                cur.append(s)
                cur_len += len(s) + 1
            else:
                if cur:
                    result.append(" ".join(cur))
                cur = [s]
                cur_len = len(s)

        if cur:
            result.append(" ".join(cur))
        return result
