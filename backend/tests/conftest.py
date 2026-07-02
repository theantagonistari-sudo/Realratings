"""Shared fixtures for Real Ratings backend tests.

Seeds admin + regular user sessions directly in MongoDB and provides
authenticated requests sessions for both.
"""
import os
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests
from dotenv import load_dotenv
from pymongo import MongoClient

# Load backend .env for Mongo settings (DB_NAME/MONGO_URL)
load_dotenv("/app/backend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback to frontend .env
    from pathlib import Path
    for line in Path("/app/frontend/.env").read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

# xdist worker id makes ids/tokens/emails unique per worker to avoid
# cross-worker delete races during teardown.
_WORKER = os.environ.get("PYTEST_XDIST_WORKER", "single")
_SUFFIX = f"{_WORKER}_{uuid.uuid4().hex[:6]}"

ADMIN_TOKEN = f"test_admin_session_token_{_SUFFIX}"
USER_TOKEN = f"test_user_session_token_{_SUFFIX}"

ADMIN_USER_ID = f"test-admin-{_SUFFIX}"
USER_USER_ID = f"test-user-{_SUFFIX}"

# Admin email must match ADMIN_EMAIL env var to exercise admin role,
# but Mongo has a unique index on email — so use the real admin email
# only if we can guarantee one worker owns it. For safety across workers,
# use a suffixed email and manually set role='admin' in Mongo (backend only
# checks role, not email, for privilege checks after login).
ADMIN_EMAIL = f"TEST_admin_{_SUFFIX}@realratings.live"
USER_EMAIL = f"TEST_jane_{_SUFFIX}@example.com"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    yield db
    client.close()


@pytest.fixture(scope="session", autouse=True)
def seed_users_and_sessions(mongo_db):
    """Seed admin + regular user with session tokens."""
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=1)

    # Admin
    mongo_db.users.update_one(
        {"email": ADMIN_EMAIL},
        {"$set": {
            "user_id": ADMIN_USER_ID,
            "email": ADMIN_EMAIL,
            "name": "Ari (Test)",
            "picture": "",
            "role": "admin",
            "created_at": now.isoformat(),
        }},
        upsert=True,
    )
    # Regular user
    mongo_db.users.update_one(
        {"email": USER_EMAIL},
        {"$set": {
            "user_id": USER_USER_ID,
            "email": USER_EMAIL,
            "name": "Jane Doe",
            "picture": "",
            "role": "user",
            "created_at": now.isoformat(),
        }},
        upsert=True,
    )

    # Sessions - store expires_at as datetime (backend handles both)
    mongo_db.user_sessions.insert_one({
        "user_id": ADMIN_USER_ID,
        "session_token": ADMIN_TOKEN,
        "expires_at": expires,
        "created_at": now,
    })
    mongo_db.user_sessions.insert_one({
        "user_id": USER_USER_ID,
        "session_token": USER_TOKEN,
        "expires_at": expires,
        "created_at": now,
    })

    yield

    # Teardown - only touch this worker's data
    mongo_db.user_sessions.delete_many({"session_token": {"$in": [ADMIN_TOKEN, USER_TOKEN]}})
    mongo_db.users.delete_many({"user_id": {"$in": [ADMIN_USER_ID, USER_USER_ID]}})
    mongo_db.properties.delete_many({"submitted_by": {"$in": [ADMIN_USER_ID, USER_USER_ID]}})
    mongo_db.chat_messages.delete_many({"user_id": {"$in": [ADMIN_USER_ID, USER_USER_ID]}})
    mongo_db.contact_messages.delete_many({"email": {"$regex": "^TEST_"}})


@pytest.fixture(scope="session")
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_client():
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ADMIN_TOKEN}",
    })
    return s


@pytest.fixture(scope="session")
def user_client():
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {USER_TOKEN}",
    })
    return s
