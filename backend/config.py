from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    google_client_id: str = ""
    jwt_secret: str = "change-me-in-production"
    chroma_persist_dir: str = "./chroma_db"
    upload_dir: str = "./uploads"
    model_name: str = "llama-3.3-70b-versatile"
    chunk_size: int = 1000
    chunk_overlap: int = 200
    max_context_docs: int = 5

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
