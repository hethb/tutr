from typing import List, Optional
from groq import Groq
from config import get_settings
from rag.embeddings import get_vector_store

SYSTEM_PROMPT = """You are an expert, warm, and engaging university tutor named Alex. You're on a live video call with a student who needs help. Your personality traits:

- **Natural and conversational**: Speak like a real person, not a textbook. Use casual but professional language.
- **Encouraging**: Celebrate small wins. When a student gets something right, acknowledge it genuinely.
- **Socratic method**: Guide students to answers rather than just giving them. Ask probing questions.
- **Patient**: Never make the student feel dumb. If they're struggling, break it down further.
- **Adaptive**: Match the student's energy and level. If they're stressed, be calming. If they're excited, match it.
- **Concise for speech**: Keep responses conversational length—like you'd actually say in a tutoring session. Avoid walls of text.

When using context from uploaded materials:
- Reference the material naturally: "Looking at your notes here..." or "Based on what's in your slides..."
- Connect concepts across different materials when relevant
- If you don't have enough context, honestly say so and ask the student to clarify

Remember: You're on a video call. The student can see and hear you. Keep responses natural and spoken-word friendly. Use short paragraphs. Avoid markdown formatting, bullet points, or code blocks in your speech—speak naturally as a tutor would."""


class TutorChain:
    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.model_name
        self.vector_store = get_vector_store()
        self.max_context_docs = settings.max_context_docs

    def get_context(self, query: str, session_id: str) -> str:
        docs = self.vector_store.query(
            query_text=query,
            session_id=session_id,
            n_results=self.max_context_docs,
        )

        if not docs:
            return ""

        context_parts = []
        for doc in docs:
            source = doc["metadata"].get("source", "unknown")
            context_parts.append(f"[From: {source}]\n{doc['content']}")

        return "\n\n---\n\n".join(context_parts)

    def chat(
        self,
        message: str,
        session_id: str,
        conversation_history: List[dict],
        course_context: Optional[str] = None,
    ) -> str:
        context = self.get_context(message, session_id)

        system_message = SYSTEM_PROMPT
        if course_context:
            system_message += f"\n\nThe student is studying: {course_context}. Tailor your help to this course."
        if context:
            system_message += f"\n\nRelevant materials from the student's uploads:\n\n{context}"

        messages = [{"role": "system", "content": system_message}]
        messages.extend(conversation_history[-20:])
        messages.append({"role": "user", "content": message})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )

        return response.choices[0].message.content

    async def chat_stream(
        self,
        message: str,
        session_id: str,
        conversation_history: List[dict],
        course_context: Optional[str] = None,
    ):
        context = self.get_context(message, session_id)

        system_message = SYSTEM_PROMPT
        if course_context:
            system_message += f"\n\nThe student is studying: {course_context}. Tailor your help to this course."
        if context:
            system_message += f"\n\nRelevant materials from the student's uploads:\n\n{context}"

        messages = [{"role": "system", "content": system_message}]
        messages.extend(conversation_history[-20:])
        messages.append({"role": "user", "content": message})

        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.7,
            max_tokens=500,
            stream=True,
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


_tutor_chain: Optional[TutorChain] = None


def get_tutor_chain() -> TutorChain:
    global _tutor_chain
    if _tutor_chain is None:
        _tutor_chain = TutorChain()
    return _tutor_chain
