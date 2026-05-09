import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List

from config import get_settings
from rag.parser import parse_file, chunk_documents
from rag.embeddings import get_vector_store

router = APIRouter()

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".pptx", ".txt", ".md",
    ".py", ".js", ".ts", ".java", ".c", ".cpp", ".h",
    ".csv", ".json",
}


@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    session_id: str = Form(...),
):
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)

    results = []
    total_chunks = 0

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            results.append({"filename": file.filename, "status": "error", "message": f"Unsupported file type: {ext}"})
            continue

        file_id = str(uuid.uuid4())
        file_path = os.path.join(settings.upload_dir, f"{file_id}{ext}")

        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)

        try:
            documents = parse_file(file_path)
            chunks = chunk_documents(
                documents,
                chunk_size=settings.chunk_size,
                chunk_overlap=settings.chunk_overlap,
            )

            vector_store = get_vector_store()
            num_added = vector_store.add_documents(chunks, session_id)
            total_chunks += num_added

            results.append({
                "filename": file.filename,
                "status": "success",
                "chunks": num_added,
            })
        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": str(e),
            })
        finally:
            if os.path.exists(file_path):
                os.remove(file_path)

    return {
        "results": results,
        "total_chunks": total_chunks,
        "session_id": session_id,
    }


@router.get("/documents/{session_id}")
async def get_documents(session_id: str):
    vector_store = get_vector_store()
    count = vector_store.get_session_doc_count(session_id)
    return {"session_id": session_id, "document_chunks": count}


@router.delete("/documents/{session_id}")
async def delete_documents(session_id: str):
    vector_store = get_vector_store()
    vector_store.delete_session(session_id)
    return {"status": "success", "session_id": session_id}
