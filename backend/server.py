"""Real Ratings Backend
Emergent Google Auth + property listings + review + chat + contact + object storage.

REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
"""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Form, Header, Query, Depends
from fastapi.responses import Response as FastAPIResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import secrets
import bcrypt
import requests
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'ari@realratings.live')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', '')
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'ari@realratings.live')
WHATSAPP_NUMBER = os.environ.get('WHATSAPP_NUMBER', '')
REVIEWER_NAME = os.environ.get('REVIEWER_NAME', 'Ari')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Real Ratings API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ----- Object Storage -----
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "realratings"
storage_key = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ----- Models -----
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "user"  # 'user' or 'admin'
    created_at: str


class Review(BaseModel):
    rating: int  # 1-5
    headline: str
    body: str
    pros: List[str] = []
    cons: List[str] = []
    reviewer_name: str = REVIEWER_NAME
    reviewed_at: Optional[str] = None


class Property(BaseModel):
    id: str
    title: str
    location: str  # city / neighborhood
    address: Optional[str] = ""
    rental_type: str  # 'rent' or 'short_stay'
    price: float
    price_period: str = "month"  # 'month' or 'night'
    bedrooms: int = 0
    bathrooms: int = 0
    description: str = ""
    amenities: List[str] = []
    images: List[str] = []  # storage paths
    status: str = "published"  # 'published', 'pending', 'rejected'
    review: Optional[Review] = None
    owner_contact: Optional[str] = None
    submitted_by: Optional[str] = None
    created_at: str
    updated_at: str


class PropertyCreate(BaseModel):
    title: str
    location: str
    address: Optional[str] = ""
    rental_type: str
    price: float
    price_period: str = "month"
    bedrooms: int = 0
    bathrooms: int = 0
    description: str = ""
    amenities: List[str] = []
    images: List[str] = []
    owner_contact: Optional[str] = None


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    rental_type: Optional[str] = None
    price: Optional[float] = None
    price_period: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    description: Optional[str] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None
    review: Optional[Review] = None


class ChatMessage(BaseModel):
    id: str
    property_id: str
    user_id: str
    user_name: str
    user_picture: Optional[str] = None
    is_admin: bool = False
    text: str
    created_at: str


class ChatMessageCreate(BaseModel):
    text: str


class ContactMessage(BaseModel):
    id: str
    property_id: Optional[str] = None
    property_title: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = ""
    message: str
    read: bool = False
    created_at: str


class ContactMessageCreate(BaseModel):
    property_id: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = ""
    message: str


# ----- Auth Helpers -----
async def get_current_user(request: Request) -> Optional[dict]:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        return None
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        return None
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        return None
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0, "password_hash": 0})
    return user


async def require_user(request: Request) -> dict:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(request: Request) -> dict:
    user = await require_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ----- Password Helpers -----
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def seed_admin():
    if not ADMIN_PASSWORD:
        return
    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    hashed = hash_password(ADMIN_PASSWORD)
    if not existing:
        await db.users.insert_one({
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "name": REVIEWER_NAME,
            "picture": "",
            "role": "admin",
            "password_hash": hashed,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin user {ADMIN_EMAIL}")
    else:
        updates = {"role": "admin"}
        if not existing.get("password_hash") or not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
            updates["password_hash"] = hashed
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": updates})
        logger.info(f"Refreshed admin user {ADMIN_EMAIL}")


class AdminLogin(BaseModel):
    email: str
    password: str


# ----- Auth Routes -----
@api_router.post("/auth/admin/login")
async def admin_login(payload: AdminLogin, response: Response):
    email = payload.email.strip().lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or user.get("role") != "admin" or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user.get("name", "Admin"),
        "picture": user.get("picture", ""),
        "role": "admin",
    }


@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    # Call emergent auth
    try:
        r = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=15
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.error(f"Emergent auth failed: {e}")
        raise HTTPException(status_code=401, detail="Auth failed")

    email = data["email"]
    name = data["name"]
    picture = data.get("picture", "")
    session_token = data["session_token"]

    # Upsert user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        role = existing.get("role", "user")
        if email == ADMIN_EMAIL and role != "admin":
            role = "admin"
            await db.users.update_one({"user_id": user_id}, {"$set": {"role": "admin", "name": name, "picture": picture}})
        else:
            await db.users.update_one({"user_id": user_id}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "admin" if email == ADMIN_EMAIL else "user"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
    )
    return {"user_id": user_id, "email": email, "name": name, "picture": picture, "role": role}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ----- Property Routes -----
def prop_from_doc(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


@api_router.get("/properties")
async def list_properties(
    location: Optional[str] = None,
    rental_type: Optional[str] = None,
    status: str = "published",
    limit: int = 100
):
    query = {"status": status}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if rental_type:
        query["rental_type"] = rental_type
    props = await db.properties.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return props


@api_router.get("/properties/locations")
async def list_locations():
    """Return unique published locations with counts."""
    pipeline = [
        {"$match": {"status": "published"}},
        {"$group": {"_id": "$location", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    rows = await db.properties.aggregate(pipeline).to_list(100)
    return [{"location": r["_id"], "count": r["count"]} for r in rows]


@api_router.get("/properties/{property_id}")
async def get_property(property_id: str):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Not found")
    return prop


@api_router.post("/properties")
async def create_property(payload: PropertyCreate, user=Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()
    prop = {
        "id": f"prop_{uuid.uuid4().hex[:12]}",
        **payload.model_dump(),
        "status": "published",
        "review": None,
        "submitted_by": user["user_id"],
        "created_at": now,
        "updated_at": now,
    }
    await db.properties.insert_one(prop)
    prop.pop("_id", None)
    return prop


@api_router.put("/properties/{property_id}")
async def update_property(property_id: str, payload: PropertyUpdate, user=Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "review" in updates and updates["review"]:
        updates["review"]["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.properties.update_one({"id": property_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    return prop


@api_router.delete("/properties/{property_id}")
async def delete_property(property_id: str, user=Depends(require_admin)):
    await db.properties.delete_one({"id": property_id})
    await db.chat_messages.delete_many({"property_id": property_id})
    return {"ok": True}


# ----- Property Submission (by owners) -----
@api_router.post("/submissions")
async def submit_property(payload: PropertyCreate, user=Depends(require_user)):
    now = datetime.now(timezone.utc).isoformat()
    prop = {
        "id": f"prop_{uuid.uuid4().hex[:12]}",
        **payload.model_dump(),
        "status": "pending",
        "review": None,
        "submitted_by": user["user_id"],
        "submitter_email": user["email"],
        "submitter_name": user["name"],
        "created_at": now,
        "updated_at": now,
    }
    await db.properties.insert_one(prop)
    prop.pop("_id", None)
    return prop


@api_router.get("/submissions")
async def list_submissions(user=Depends(require_admin)):
    props = await db.properties.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return props


# ----- Chat Routes (polling based) -----
@api_router.get("/properties/{property_id}/messages")
async def get_messages(property_id: str, since: Optional[str] = None, limit: int = 200):
    query = {"property_id": property_id}
    if since:
        query["created_at"] = {"$gt": since}
    msgs = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(limit)
    return msgs


@api_router.post("/properties/{property_id}/messages")
async def post_message(property_id: str, payload: ChatMessageCreate, user=Depends(require_user)):
    prop = await db.properties.find_one({"id": property_id}, {"_id": 0})
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    msg = {
        "id": f"msg_{uuid.uuid4().hex[:12]}",
        "property_id": property_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_picture": user.get("picture", ""),
        "is_admin": user.get("role") == "admin",
        "text": payload.text.strip()[:2000],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.chat_messages.insert_one(msg)
    msg.pop("_id", None)
    return msg


@api_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user=Depends(require_admin)):
    await db.chat_messages.delete_one({"id": message_id})
    return {"ok": True}


# ----- Contact Routes -----
@api_router.post("/contact")
async def submit_contact(payload: ContactMessageCreate):
    prop_title = None
    if payload.property_id:
        p = await db.properties.find_one({"id": payload.property_id}, {"_id": 0, "title": 1})
        if p:
            prop_title = p.get("title")
    msg = {
        "id": f"contact_{uuid.uuid4().hex[:12]}",
        **payload.model_dump(),
        "property_title": prop_title,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.contact_messages.insert_one(msg)
    msg.pop("_id", None)
    return {"ok": True, "id": msg["id"]}


@api_router.get("/contact")
async def list_contact(user=Depends(require_admin)):
    msgs = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return msgs


@api_router.put("/contact/{msg_id}/read")
async def mark_read(msg_id: str, user=Depends(require_admin)):
    await db.contact_messages.update_one({"id": msg_id}, {"$set": {"read": True}})
    return {"ok": True}


@api_router.delete("/contact/{msg_id}")
async def delete_contact(msg_id: str, user=Depends(require_admin)):
    await db.contact_messages.delete_one({"id": msg_id})
    return {"ok": True}


# ----- File Upload / Serve -----
MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp"
}


@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(require_user)):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    content_type = file.content_type or MIME_TYPES.get(ext, "application/octet-stream")
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only images allowed")
    path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4().hex}.{ext}"
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 8 MB")
    try:
        result = put_object(path, data, content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")
    await db.files.insert_one({
        "id": f"file_{uuid.uuid4().hex[:12]}",
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "user_id": user["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"path": result["path"]}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        data, content_type = get_object(path)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")
    return FastAPIResponse(content=data, media_type=record.get("content_type", content_type))


# ----- IQ Test -----
class IQAttemptCreate(BaseModel):
    iq: int
    iq_lo: int
    iq_hi: int
    theta: float
    sem: float
    answered: int
    correct: int
    domains: dict = {}


@api_router.post("/iq/attempts")
async def create_iq_attempt(payload: IQAttemptCreate, user=Depends(require_user)):
    doc = {
        "id": f"iq_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.iq_attempts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/iq/me/latest")
async def latest_iq(user=Depends(require_user)):
    doc = await db.iq_attempts.find_one(
        {"user_id": user["user_id"]}, {"_id": 0}, sort=[("created_at", -1)]
    )
    return doc or {}


@api_router.get("/iq/me/history")
async def iq_history(user=Depends(require_user)):
    rows = await db.iq_attempts.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return rows


# ----- User Profile -----
class ReadingAttemptCreate(BaseModel):
    best_fit: str
    label: str
    free_wpm: int
    free_comp: float
    free_cawpm: int
    chunked_wpm: int
    chunked_comp: float
    chunked_cawpm: int
    pacer_wpm: int
    pacer_comp: float
    pacer_cawpm: int


@api_router.post("/reading/attempts")
async def create_reading_attempt(payload: ReadingAttemptCreate, user=Depends(require_user)):
    doc = {
        "id": f"read_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        **payload.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.reading_attempts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/reading/me/latest")
async def latest_reading(user=Depends(require_user)):
    doc = await db.reading_attempts.find_one(
        {"user_id": user["user_id"]}, {"_id": 0}, sort=[("created_at", -1)]
    )
    return doc or {}


@api_router.get("/me/properties")
async def my_properties(user=Depends(require_user)):
    rows = await db.properties.find(
        {"submitted_by": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return rows


# ----- Subscribers (Lead capture) -----
class SubscriberCreate(BaseModel):
    email: str
    name: Optional[str] = ""
    source: str = "iq_test"  # 'iq_test' | 'footer' | 'contact'
    iq_score: Optional[int] = None


@api_router.post("/subscribers")
async def create_subscriber(payload: SubscriberCreate):
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email")
    existing = await db.subscribers.find_one({"email": email}, {"_id": 0})
    if existing:
        updates = {"last_seen_at": datetime.now(timezone.utc).isoformat()}
        if payload.iq_score is not None:
            updates["iq_score"] = payload.iq_score
        if payload.name:
            updates["name"] = payload.name
        await db.subscribers.update_one({"email": email}, {"$set": updates})
        return {"ok": True, "id": existing["id"], "duplicate": True}
    doc = {
        "id": f"sub_{uuid.uuid4().hex[:12]}",
        "email": email,
        "name": payload.name or "",
        "source": payload.source,
        "iq_score": payload.iq_score,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_seen_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.subscribers.insert_one(doc)
    doc.pop("_id", None)
    return {"ok": True, "id": doc["id"], "duplicate": False}


@api_router.get("/subscribers")
async def list_subscribers(user=Depends(require_admin)):
    rows = await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return rows


@api_router.delete("/subscribers/{sub_id}")
async def delete_subscriber(sub_id: str, user=Depends(require_admin)):
    await db.subscribers.delete_one({"id": sub_id})
    return {"ok": True}


# ----- Finance import (LLM parse) -----
FINANCE_CATEGORIES = [
    "salary", "freelance", "investments", "other-income",
    "housing", "food", "transport", "utilities", "health",
    "entertainment", "shopping", "education", "other",
]

FINANCE_SYSTEM_PROMPT = f"""You extract personal-finance transactions from raw text or an image (receipt / bank statement / spending list).

Return ONLY a valid JSON array. Each element must have EXACTLY these fields:
- date: ISO date string YYYY-MM-DD (today's date {{today}} if not specified)
- type: "income" or "expense"
- category: one of {FINANCE_CATEGORIES}
- amount: positive number in the user's local currency (never negative — use `type` for sign)
- note: short human-readable description (<= 40 chars, no PII)

Rules:
- Money IN falls into ONE of two categories on the income side:
    a) "investments" → dividends, interest received, yield, capital gains, sale proceeds, coupon (i.e. INVESTMENT RETURNS)
    b) salary / freelance / other-income → wages, refunds, gifts received, cashback, etc.
- Money OUT (all EXPENSES) uses one of: housing / food / transport / utilities / health / entertainment / shopping / education / other.
- Loan payments (mortgage, credit card payment, student loan payment) → category = "housing" for mortgage, "other" otherwise, type = "expense".
- Investment PURCHASES (buying an ETF, stock, crypto, contributing to IRA/401k, brokerage deposit) → category = "other", type = "expense", note prefixed with "Investment: ". These are not returns.
- Skip informational-only rows (totals, subtotals, headers).
- If truly nothing found, return [].
Return ONLY the JSON array. No prose, no code fence."""


class FinanceParseTextIn(BaseModel):
    text: str


@api_router.post("/finance/parse-text")
async def parse_finance_text(payload: FinanceParseTextIn, user=Depends(require_user)):
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Empty text")
    return await _run_finance_parse(text=payload.text.strip())


@api_router.post("/finance/parse-image")
async def parse_finance_image(file: UploadFile = File(...), user=Depends(require_user)):
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Max 8 MB")
    import base64 as _b64
    return await _run_finance_parse(image_b64=_b64.b64encode(data).decode("ascii"), mime=file.content_type or "image/jpeg")


async def _run_finance_parse(text: str = None, image_b64: str = None, mime: str = None):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent, TextDelta, StreamDone
    import json as _json
    today = datetime.now(timezone.utc).date().isoformat()
    system = FINANCE_SYSTEM_PROMPT.replace("{today}", today)
    chat = LlmChat(
        api_key=EMERGENT_KEY,
        session_id=f"finance-parse-{uuid.uuid4().hex[:8]}",
        system_message=system,
    ).with_model("gemini", "gemini-3-flash-preview")

    user_text = "Extract transactions from the attached image." if image_b64 else f"Extract transactions from this text:\n\n{text}"
    file_contents = [ImageContent(image_base64=image_b64)] if image_b64 else None

    full = ""
    try:
        async for ev in chat.stream_message(UserMessage(text=user_text, file_contents=file_contents)):
            if isinstance(ev, TextDelta):
                full += ev.content
            elif isinstance(ev, StreamDone):
                break
    except Exception as e:
        logger.error(f"LLM parse failed: {e}")
        raise HTTPException(status_code=502, detail="Parser unavailable")

    # Sanitize response — strip code fences if any
    cleaned = full.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    try:
        arr = _json.loads(cleaned)
        if not isinstance(arr, list):
            arr = []
    except Exception:
        logger.warning(f"LLM returned non-JSON: {full[:400]}")
        arr = []
    # Normalise
    out = []
    for item in arr[:100]:
        try:
            out.append({
                "date": str(item.get("date") or today)[:10],
                "type": "income" if item.get("type") == "income" else "expense",
                "category": item.get("category") if item.get("category") in FINANCE_CATEGORIES else "other",
                "amount": max(0.0, float(item.get("amount", 0))),
                "note": str(item.get("note", ""))[:80],
            })
        except Exception:
            continue
    return {"transactions": out, "count": len(out)}


# ----- Site Config -----
@api_router.get("/site/config")
async def site_config():
    return {
        "contact_email": CONTACT_EMAIL,
        "whatsapp_number": WHATSAPP_NUMBER,
        "reviewer_name": REVIEWER_NAME,
        "brand": "Real Ratings",
    }


@api_router.get("/")
async def root():
    return {"service": "Real Ratings API", "ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init: {e}")
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.properties.create_index("id", unique=True)
    await db.chat_messages.create_index([("property_id", 1), ("created_at", 1)])
    # Seed admin
    try:
        await seed_admin()
    except Exception as e:
        logger.error(f"Admin seed failed: {e}")
    logger.info("Real Ratings API ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
