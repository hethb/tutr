import chromadb
from langchain.schema import Document
from typing import List, Optional
import hashlib

from config import get_settings


class VectorStore:
    """Uses ChromaDB's built-in embedding function (all-MiniLM-L6-v2 via onnxruntime).
    Runs entirely locally — no API key required for embeddings."""

    def __init__(self):
        settings = get_settings()
        self.client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
        self.collection = self.client.get_or_create_collection(
            name="tutr_documents",
            metadata={"hnsw:space": "cosine"},
        )

    def add_documents(self, documents: List[Document], session_id: str) -> int:
        if not documents:
            return 0

        ids = []
        texts = []
        metadatas = []

        for i, doc in enumerate(documents):
            doc_hash = hashlib.md5(doc.page_content.encode()).hexdigest()
            doc_id = f"{session_id}_{doc_hash}_{i}"
            ids.append(doc_id)
            texts.append(doc.page_content)
            metadata = {**doc.metadata, "session_id": session_id}
            metadatas.append(metadata)

        self.collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas,
        )

        return len(ids)

    def query(self, query_text: str, session_id: str, n_results: int = 5) -> List[dict]:
        try:
            count = self.collection.count()
            if count == 0:
                return []
        except Exception:
            return []

        results = self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where={"session_id": session_id},
        )

        docs = []
        if results and results["documents"]:
            for i, doc_text in enumerate(results["documents"][0]):
                docs.append({
                    "content": doc_text,
                    "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                    "distance": results["distances"][0][i] if results["distances"] else 0,
                })

        return docs

    def delete_session(self, session_id: str):
        try:
            self.collection.delete(where={"session_id": session_id})
        except Exception:
            pass

    def get_session_doc_count(self, session_id: str) -> int:
        try:
            results = self.collection.get(where={"session_id": session_id})
            return len(results["ids"]) if results else 0
        except Exception:
            return 0


_vector_store: Optional[VectorStore] = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
