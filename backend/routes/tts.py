from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    voice: str = ""


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    return {"message": "TTS is handled client-side via browser SpeechSynthesis API"}
