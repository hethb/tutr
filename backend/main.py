import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import init_db
from routes.upload import router as upload_router
from routes.chat import router as chat_router
from routes.courses import router as courses_router
from routes.tts import router as tts_router
from routes.auth import router as auth_router
from routes.user_data import router as user_data_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Tutr API", version="1.0.0", lifespan=lifespan)

origins = ["http://localhost:5173", "http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(courses_router, prefix="/api", tags=["courses"])
app.include_router(tts_router, prefix="/api", tags=["tts"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(user_data_router, prefix="/api", tags=["user"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
