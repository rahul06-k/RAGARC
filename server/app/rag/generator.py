import time
import re
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.rag.prompts import SYSTEM_RAG_PROMPT, build_rag_prompt


class LLMGenerator:
    def generate_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None
    ) -> Tuple[str, bool, float, str]:
        """
        Returns (answer_text, is_grounded, latency_seconds, model_name)
        """
        raise NotImplementedError


class GeminiLLMGenerator(LLMGenerator):
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.LLM_MODEL_NAME or "gemini-1.5-flash"
        self._configured = False

    def _configure(self):
        if not self._configured and self.api_key:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            self._configured = True

    def generate_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None
    ) -> Tuple[str, bool, float, str]:
        if not self.api_key:
            return ExtractiveLocalGenerator().generate_answer(question, retrieved_chunks, conversation_history)

        start_time = time.time()
        try:
            self._configure()
            import google.generativeai as genai

            full_prompt = build_rag_prompt(question, retrieved_chunks, conversation_history)
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=SYSTEM_RAG_PROMPT
            )
            response = model.generate_content(
                full_prompt,
                generation_config={"temperature": 0.2, "max_output_tokens": 1024}
            )
            latency = time.time() - start_time
            answer = response.text.strip() if response.text else "Unable to generate a response."
            
            # Check if answer represents unavailable information
            is_grounded = "couldn't find information" not in answer.lower() and "cannot find information" not in answer.lower()
            return answer, is_grounded, round(latency, 3), self.model_name
        except Exception as e:
            print(f"[GeminiGenerator] Error: {e}. Falling back to Extractive Local Generator.")
            return ExtractiveLocalGenerator().generate_answer(question, retrieved_chunks, conversation_history)


class OpenAILLMGenerator(LLMGenerator):
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model_name = model_name or "gpt-4o-mini"
        self._client = None

    def _get_client(self):
        if self._client is None and self.api_key:
            from openai import OpenAI
            self._client = OpenAI(api_key=self.api_key)
        return self._client

    def generate_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None
    ) -> Tuple[str, bool, float, str]:
        client = self._get_client()
        if not client:
            return ExtractiveLocalGenerator().generate_answer(question, retrieved_chunks, conversation_history)

        start_time = time.time()
        try:
            full_prompt = build_rag_prompt(question, retrieved_chunks, conversation_history)
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": SYSTEM_RAG_PROMPT},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.2,
                max_tokens=1024
            )
            latency = time.time() - start_time
            answer = response.choices[0].message.content.strip()
            is_grounded = "couldn't find information" not in answer.lower()
            return answer, is_grounded, round(latency, 3), self.model_name
        except Exception as e:
            print(f"[OpenAIGenerator] Error: {e}. Falling back to Extractive Local Generator.")
            return ExtractiveLocalGenerator().generate_answer(question, retrieved_chunks, conversation_history)


class ExtractiveLocalGenerator(LLMGenerator):
    """
    Intelligent heuristic extractive generator for offline / zero-API-key execution.
    Extracts relevant factual paragraphs from retrieved chunks and synthesizes a clean grounded answer.
    """
    def generate_answer(
        self,
        question: str,
        retrieved_chunks: List[Dict[str, Any]],
        conversation_history: List[Dict[str, str]] = None
    ) -> Tuple[str, bool, float, str]:
        start_time = time.time()

        if not retrieved_chunks:
            latency = time.time() - start_time
            return (
                "I couldn't find information about this in the available college documents. Please consult the college administration office or check the official student notice board.",
                False,
                round(latency, 3),
                "extractive-local-rag"
            )

        # Check if top score meets minimum threshold
        top_score = retrieved_chunks[0].get("score", 0.0)
        if top_score < settings.SIMILARITY_THRESHOLD:
            latency = time.time() - start_time
            return (
                f"I couldn't find sufficient authoritative information to answer '{question}' in the uploaded college knowledge base.",
                False,
                round(latency, 3),
                "extractive-local-rag"
            )

        # Extract informative content words (filtering common English stopwords)
        STOPWORDS = {
            "what", "when", "where", "which", "who", "whom", "whose", "why", "how",
            "the", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "a", "an", "and", "but", "if", "or", "as", "until", "while",
            "of", "at", "by", "for", "with", "about", "between", "into", "through", "during",
            "before", "after", "to", "from", "in", "out", "on", "off", "over", "under", "again",
            "then", "here", "there", "all", "any", "both", "each", "few", "more", "most", "other",
            "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very",
            "can", "will", "just", "should", "now", "tell", "give", "details", "information", "please"
        }
        all_words = set(re.findall(r'\b\w{3,}\b', question.lower()))
        content_words = {w for w in all_words if w not in STOPWORDS}
        eval_words = content_words if content_words else all_words

        salient_points = []

        for chunk in retrieved_chunks[:4]:
            text = chunk.get("text", "")
            meta = chunk.get("metadata", {})
            title = meta.get("document_title", "College Document")
            page = meta.get("page_number", 1)

            paragraphs = text.split("\n\n")
            for p in paragraphs:
                p_clean = p.strip()
                if not p_clean:
                    continue
                p_lower = p_clean.lower()
                matches = sum(1 for w in eval_words if w in p_lower)
                match_ratio = matches / len(eval_words) if eval_words else 0.0

                # Must meet substantive match threshold
                if len(eval_words) <= 2 and matches >= 1:
                    salient_points.append((matches, p_clean, title, page))
                elif len(eval_words) > 2 and (match_ratio >= 0.45 or matches >= 3):
                    salient_points.append((matches, p_clean, title, page))

        salient_points.sort(key=lambda x: x[0], reverse=True)

        if not salient_points:
            latency = time.time() - start_time
            return (
                "I couldn't find information about this in the available college documents. Please consult the college administration office or check the official student notice board.",
                False,
                round(latency, 3),
                "extractive-local-rag"
            )

        selected_points = [p[1] for p in salient_points[:4]]
        unique_points = list(dict.fromkeys(selected_points))
        answer = "\n\n".join(unique_points)

        latency = time.time() - start_time
        return answer, True, round(latency, 3), "extractive-local-rag"


def get_llm_generator() -> LLMGenerator:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMGenerator()
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAILLMGenerator()
    elif provider == "mock" or not (settings.GEMINI_API_KEY or settings.OPENAI_API_KEY):
        return ExtractiveLocalGenerator()
    else:
        return GeminiLLMGenerator()
