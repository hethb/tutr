from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Set
import json
import asyncio

from rag.retriever import get_tutor_chain

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: str
    conversation_history: List[ChatMessage] = []
    course_context: Optional[str] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    tutor = get_tutor_chain()
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    response = tutor.chat(
        message=request.message,
        session_id=request.session_id,
        conversation_history=history,
        course_context=request.course_context,
    )

    return {"response": response}


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    tutor = get_tutor_chain()
    history = [{"role": m.role, "content": m.content} for m in request.conversation_history]

    async def generate():
        async for chunk in tutor.chat_stream(
            message=request.message,
            session_id=request.session_id,
            conversation_history=history,
            course_context=request.course_context,
        ):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# Multi-student session room management
class SessionRoom:
    def __init__(self):
        self.participants: Dict[str, WebSocket] = {}
        self.conversation_history: List[dict] = []
        self.course_context: Optional[str] = None

    async def broadcast(self, message: dict, exclude: Optional[str] = None):
        disconnected = []
        for uid, ws in self.participants.items():
            if uid != exclude:
                try:
                    await ws.send_text(json.dumps(message))
                except Exception:
                    disconnected.append(uid)
        for uid in disconnected:
            self.participants.pop(uid, None)

    def participant_list(self) -> List[dict]:
        return [{"id": uid, "name": uid} for uid in self.participants]


rooms: Dict[str, SessionRoom] = {}


def get_room(session_id: str) -> SessionRoom:
    if session_id not in rooms:
        rooms[session_id] = SessionRoom()
    return rooms[session_id]


@router.websocket("/ws/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str):
    await websocket.accept()
    tutor = get_tutor_chain()

    data = await websocket.receive_text()
    join_data = json.loads(data)
    user_name = join_data.get("user_name", f"Student_{id(websocket) % 10000}")
    user_id = join_data.get("user_id", user_name)

    room = get_room(session_id)
    room.participants[user_id] = websocket

    await room.broadcast({
        "type": "participant_joined",
        "user_id": user_id,
        "user_name": user_name,
        "participants": room.participant_list(),
    })

    await websocket.send_text(json.dumps({
        "type": "joined",
        "user_id": user_id,
        "participants": room.participant_list(),
        "history": room.conversation_history[-50:],
    }))

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type", "message")

            if msg_type == "set_course":
                room.course_context = message_data.get("course")
                await room.broadcast({
                    "type": "system",
                    "content": f"Course context set to: {room.course_context}",
                })
                continue

            if msg_type == "peer_message":
                await room.broadcast({
                    "type": "peer_message",
                    "user_id": user_id,
                    "user_name": user_name,
                    "content": message_data.get("content", ""),
                }, exclude=user_id)
                continue

            user_message = message_data.get("message", "")
            if not user_message:
                continue

            room.conversation_history.append({
                "role": "user",
                "content": f"[{user_name}]: {user_message}",
            })

            await room.broadcast({
                "type": "user_message",
                "user_id": user_id,
                "user_name": user_name,
                "content": user_message,
            }, exclude=user_id)

            full_response = ""
            async for chunk in tutor.chat_stream(
                message=user_message,
                session_id=session_id,
                conversation_history=room.conversation_history[:-1],
                course_context=room.course_context,
            ):
                full_response += chunk
                await room.broadcast({
                    "type": "stream",
                    "content": chunk,
                })

            room.conversation_history.append({"role": "assistant", "content": full_response})

            await room.broadcast({
                "type": "end",
                "content": full_response,
            })

    except WebSocketDisconnect:
        room.participants.pop(user_id, None)
        await room.broadcast({
            "type": "participant_left",
            "user_id": user_id,
            "user_name": user_name,
            "participants": room.participant_list(),
        })
        if not room.participants:
            rooms.pop(session_id, None)


@router.get("/session/{session_id}/participants")
async def get_participants(session_id: str):
    room = get_room(session_id)
    return {"participants": room.participant_list()}
