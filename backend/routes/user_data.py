from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import json

from auth_middleware import get_current_user
from database import get_user_stats, save_user_stats, create_session, get_sessions, get_session_detail

router = APIRouter()


class StatsUpdate(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    total_xp: int = 0
    level: int = 1
    last_study_date: Optional[str] = None
    total_messages: int = 0
    total_study_minutes: int = 0
    weekly_goal_minutes: int = 120
    unlocked_achievements: List[str] = []


class MessageEntry(BaseModel):
    role: str
    content: str


class SessionCreate(BaseModel):
    date: str
    start_time: int
    end_time: int
    duration_minutes: int
    course: Optional[str] = None
    message_count: int = 0
    xp_earned: int = 0
    messages: List[MessageEntry] = []


@router.get("/user/stats")
async def read_stats(user: dict = Depends(get_current_user)):
    stats = get_user_stats(user["id"])
    return {"stats": stats}


@router.put("/user/stats")
async def write_stats(update: StatsUpdate, user: dict = Depends(get_current_user)):
    save_user_stats(user["id"], update.model_dump())
    return {"status": "ok"}


@router.get("/user/sessions")
async def list_sessions(
    limit: int = 50,
    offset: int = 0,
    user: dict = Depends(get_current_user),
):
    sessions = get_sessions(user["id"], limit=limit, offset=offset)
    return {"sessions": sessions}


@router.post("/user/sessions")
async def record_session(session: SessionCreate, user: dict = Depends(get_current_user)):
    session_data = session.model_dump()
    session_data["messages"] = [m.model_dump() for m in session.messages]
    session_id = create_session(user["id"], session_data)
    return {"session_id": session_id}


@router.get("/user/sessions/{session_id}")
async def read_session(session_id: int, user: dict = Depends(get_current_user)):
    detail = get_session_detail(user["id"], session_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"session": detail}
