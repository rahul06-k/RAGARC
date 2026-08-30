from typing import List, Dict, Any

SYSTEM_RAG_PROMPT = """You are the official College Information Assistant, an authoritative and helpful AI designed to answer student questions strictly using the provided College Knowledge Base documents.

CRITICAL INSTRUCTIONS & GROUNDING RULES:
1. Grounded Answers Only: Answer the student's question using ONLY the facts explicitly stated in the RETRIEVED CONTEXT below. Do NOT assume, extrapolate, or use outside knowledge.
2. Zero Hallucination: NEVER fabricate fees, dates, admission cut-offs, grading rules, contact numbers, email addresses, hostel rules, or policies.
3. Unavailable Information Handling: If the RETRIEVED CONTEXT does NOT contain enough authoritative information to answer the question, clearly state:
   "I couldn't find information about this in the available college documents. Please consult the college administration office or check the official student notice board."
4. Source Attribution: When providing information, be specific, concise, and professional. The system will automatically cite the sources, but keep your phrasing directly aligned with the retrieved facts.
5. Conversation Awareness: If the student asks a follow-up question (e.g. "What about mess fees?" following a hostel question), maintain conversational continuity with prior context, but NEVER override verified document facts.
"""

def format_context_for_prompt(retrieved_chunks: List[Dict[str, Any]]) -> str:
    """Format retrieved chunks into structured context text for the LLM."""
    if not retrieved_chunks:
        return "NO RELEVANT COLLEGE DOCUMENTS FOUND."

    context_blocks = []
    for i, chunk in enumerate(retrieved_chunks, 1):
        meta = chunk.get("metadata", {})
        doc_title = meta.get("document_title", meta.get("filename", "Document"))
        page_num = meta.get("page_number", 1)
        category = meta.get("category", "General")
        text = chunk.get("text", "").strip()

        block = f"[Source {i}: {doc_title} (Page {page_num}, Category: {category})]\n{text}"
        context_blocks.append(block)

    return "\n\n---\n\n".join(context_blocks)


def build_rag_prompt(
    question: str,
    retrieved_chunks: List[Dict[str, Any]],
    conversation_history: List[Dict[str, str]] = None
) -> str:
    """Construct full grounded prompt for the LLM."""
    formatted_context = format_context_for_prompt(retrieved_chunks)

    history_str = ""
    if conversation_history:
        history_lines = []
        for msg in conversation_history[-6:]:  # Last 3 turns
            role = "Student" if msg.get("role") == "user" else "Assistant"
            content = msg.get("content", "")
            history_lines.append(f"{role}: {content}")
        if history_lines:
            history_str = "RECENT CONVERSATION HISTORY:\n" + "\n".join(history_lines) + "\n\n"

    prompt = f"""{history_str}RETRIEVED COLLEGE DOCUMENTS CONTEXT:
{formatted_context}

STUDENT QUESTION:
{question}

OFFICIAL ASSISTANT GROUNDED ANSWER:"""

    return prompt
