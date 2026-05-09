import sqlite3
import os
import json
from contextlib import contextmanager

DB_PATH = os.path.join(os.path.dirname(__file__), "tutr.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_id TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                name TEXT NOT NULL,
                avatar_url TEXT DEFAULT '',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS user_stats (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                current_streak INTEGER DEFAULT 0,
                longest_streak INTEGER DEFAULT 0,
                total_xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                last_study_date TEXT,
                total_messages INTEGER DEFAULT 0,
                total_study_minutes INTEGER DEFAULT 0,
                weekly_goal_minutes INTEGER DEFAULT 120,
                unlocked_achievements_json TEXT DEFAULT '[]'
            );

            CREATE TABLE IF NOT EXISTS study_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                date TEXT NOT NULL,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                duration_minutes INTEGER NOT NULL,
                course TEXT,
                message_count INTEGER DEFAULT 0,
                xp_earned INTEGER DEFAULT 0,
                messages_json TEXT DEFAULT '[]',
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user ON study_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_date ON study_sessions(user_id, date);
        """)


def upsert_user(google_id: str, email: str, name: str, avatar_url: str = "") -> dict:
    with get_db() as conn:
        conn.execute(
            """INSERT INTO users (google_id, email, name, avatar_url)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(google_id) DO UPDATE SET
                 email=excluded.email, name=excluded.name, avatar_url=excluded.avatar_url""",
            (google_id, email, name, avatar_url),
        )
        row = conn.execute("SELECT * FROM users WHERE google_id=?", (google_id,)).fetchone()
        user = dict(row)

        existing = conn.execute("SELECT 1 FROM user_stats WHERE user_id=?", (user["id"],)).fetchone()
        if not existing:
            conn.execute("INSERT INTO user_stats (user_id) VALUES (?)", (user["id"],))

        return user


def get_user_by_id(user_id: int) -> dict | None:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return dict(row) if row else None


def get_user_stats(user_id: int) -> dict:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM user_stats WHERE user_id=?", (user_id,)).fetchone()
        if not row:
            conn.execute("INSERT INTO user_stats (user_id) VALUES (?)", (user_id,))
            row = conn.execute("SELECT * FROM user_stats WHERE user_id=?", (user_id,)).fetchone()
        stats = dict(row)
        stats["unlocked_achievements"] = json.loads(stats.pop("unlocked_achievements_json", "[]"))
        return stats


def save_user_stats(user_id: int, stats: dict):
    achievements_json = json.dumps(stats.get("unlocked_achievements", []))
    with get_db() as conn:
        conn.execute(
            """UPDATE user_stats SET
                current_streak=?, longest_streak=?, total_xp=?, level=?,
                last_study_date=?, total_messages=?, total_study_minutes=?,
                weekly_goal_minutes=?, unlocked_achievements_json=?
               WHERE user_id=?""",
            (
                stats.get("current_streak", 0),
                stats.get("longest_streak", 0),
                stats.get("total_xp", 0),
                stats.get("level", 1),
                stats.get("last_study_date"),
                stats.get("total_messages", 0),
                stats.get("total_study_minutes", 0),
                stats.get("weekly_goal_minutes", 120),
                achievements_json,
                user_id,
            ),
        )


def create_session(user_id: int, session: dict) -> int:
    messages_json = json.dumps(session.get("messages", []))
    with get_db() as conn:
        cursor = conn.execute(
            """INSERT INTO study_sessions
               (user_id, date, start_time, end_time, duration_minutes, course, message_count, xp_earned, messages_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                session["date"],
                session["start_time"],
                session["end_time"],
                session["duration_minutes"],
                session.get("course"),
                session.get("message_count", 0),
                session.get("xp_earned", 0),
                messages_json,
            ),
        )
        return cursor.lastrowid


def get_sessions(user_id: int, limit: int = 50, offset: int = 0) -> list[dict]:
    with get_db() as conn:
        rows = conn.execute(
            """SELECT id, date, start_time, end_time, duration_minutes, course,
                      message_count, xp_earned, created_at
               FROM study_sessions WHERE user_id=?
               ORDER BY start_time DESC LIMIT ? OFFSET ?""",
            (user_id, limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]


def get_session_detail(user_id: int, session_id: int) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM study_sessions WHERE id=? AND user_id=?",
            (session_id, user_id),
        ).fetchone()
        if not row:
            return None
        result = dict(row)
        result["messages"] = json.loads(result.pop("messages_json", "[]"))
        return result
