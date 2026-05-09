import jwt
import datetime
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from config import get_settings
from database import upsert_user
from auth_middleware import get_current_user

router = APIRouter()


class GoogleAuthRequest(BaseModel):
    credential: str


@router.post("/auth/google")
async def google_auth(request: GoogleAuthRequest):
    settings = get_settings()

    try:
        idinfo = id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    name = idinfo.get("name", email)
    avatar_url = idinfo.get("picture", "")

    user = upsert_user(google_id, email, name, avatar_url)

    token = jwt.encode(
        {
            "user_id": user["id"],
            "email": email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30),
        },
        settings.jwt_secret,
        algorithm="HS256",
    )

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
        },
    }


@router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "avatar_url": user["avatar_url"],
        }
    }
