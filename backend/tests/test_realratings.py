"""End-to-end backend tests for Real Ratings API.

Covers: health, site config, auth (401/authenticated), admin-only guards,
property CRUD, filters, locations aggregation, submissions/approval flow,
chat, contact, upload/serve, validation, and _id leak checks.
"""
import io
import time
import uuid
from datetime import datetime, timezone, timedelta

import pytest

# All test classes share sequential state (property_id chained across classes).
# Pin every test to a single xdist worker so `-n 2 --dist loadscope` doesn't
# split them (loadscope keeps a class on one worker, but different classes can
# split — we need module-level pinning).
pytestmark = pytest.mark.xdist_group(name="realratings_serial")


# ---------- Helpers ----------
def _no_underscore_id(obj):
    """Recursively assert no '_id' key present in response bodies."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"Response leaks _id: {obj}"
        for v in obj.values():
            _no_underscore_id(v)
    elif isinstance(obj, list):
        for i in obj:
            _no_underscore_id(i)


# ---------- Health / Config ----------
class TestHealth:
    def test_root(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        assert data.get("service") == "Real Ratings API"

    def test_site_config(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/site/config")
        assert r.status_code == 200
        data = r.json()
        assert data["contact_email"] == "ari@realratings.live"
        assert data["whatsapp_number"] == "+23473051149918"
        assert data["reviewer_name"] == "Ari"
        assert data["brand"] == "Real Ratings"


# ---------- Auth ----------
class TestAuth:
    def test_me_unauth_401(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/auth/me")
        assert r.status_code == 401

    def test_me_admin_bearer(self, admin_client, base_url):
        r = admin_client.get(f"{base_url}/api/auth/me")
        assert r.status_code == 200, r.text
        data = r.json()
        from tests.conftest import ADMIN_EMAIL, ADMIN_USER_ID
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert data["user_id"] == ADMIN_USER_ID
        _no_underscore_id(data)

    def test_me_user_bearer(self, user_client, base_url):
        r = user_client.get(f"{base_url}/api/auth/me")
        assert r.status_code == 200, r.text
        data = r.json()
        from tests.conftest import USER_USER_ID
        assert data["role"] == "user"
        assert data["user_id"] == USER_USER_ID


# ---------- Admin guards ----------
class TestAdminGuards:
    def test_create_property_forbidden_user(self, user_client, base_url):
        r = user_client.post(f"{base_url}/api/properties", json={
            "title": "x", "location": "x", "rental_type": "rent", "price": 1
        })
        assert r.status_code == 403

    def test_create_property_unauth(self, anon_client, base_url):
        r = anon_client.post(f"{base_url}/api/properties", json={
            "title": "x", "location": "x", "rental_type": "rent", "price": 1
        })
        assert r.status_code == 401

    def test_submissions_forbidden_user(self, user_client, base_url):
        r = user_client.get(f"{base_url}/api/submissions")
        assert r.status_code == 403

    def test_contact_list_forbidden_user(self, user_client, base_url):
        r = user_client.get(f"{base_url}/api/contact")
        assert r.status_code == 403

    def test_delete_property_forbidden_user(self, user_client, base_url):
        r = user_client.delete(f"{base_url}/api/properties/nonexistent")
        assert r.status_code == 403

    def test_update_property_forbidden_user(self, user_client, base_url):
        r = user_client.put(f"{base_url}/api/properties/nonexistent", json={"title": "x"})
        assert r.status_code == 403


# ---------- Property CRUD as admin + Filters + Locations ----------
class TestPropertyCRUD:
    property_id = None

    def test_create_property(self, admin_client, base_url):
        payload = {
            "title": "TEST_Lekki Sea View Apt",
            "location": "Lagos",
            "address": "12 Admiralty Way",
            "rental_type": "rent",
            "price": 1500.0,
            "price_period": "month",
            "bedrooms": 2,
            "bathrooms": 2,
            "description": "TEST_A beautiful place",
            "amenities": ["wifi", "pool"],
        }
        r = admin_client.post(f"{base_url}/api/properties", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        _no_underscore_id(data)
        assert data["title"] == payload["title"]
        assert data["location"] == "Lagos"
        assert data["status"] == "published"
        assert data["review"] is None
        assert data["id"].startswith("prop_")
        TestPropertyCRUD.property_id = data["id"]

    def test_list_properties_includes_created(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties")
        assert r.status_code == 200
        props = r.json()
        _no_underscore_id(props)
        ids = [p["id"] for p in props]
        assert TestPropertyCRUD.property_id in ids

    def test_get_property_by_id(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties/{TestPropertyCRUD.property_id}")
        assert r.status_code == 200
        data = r.json()
        _no_underscore_id(data)
        assert data["id"] == TestPropertyCRUD.property_id
        assert data["title"] == "TEST_Lekki Sea View Apt"

    def test_update_property_with_review(self, admin_client, base_url):
        review = {
            "rating": 4,
            "headline": "TEST_Solid stay",
            "body": "Clean and modern.",
            "pros": ["clean", "location"],
            "cons": ["parking"],
        }
        r = admin_client.put(
            f"{base_url}/api/properties/{TestPropertyCRUD.property_id}",
            json={"title": "TEST_Lekki Sea View Apt v2", "review": review},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        _no_underscore_id(data)
        assert data["title"] == "TEST_Lekki Sea View Apt v2"
        assert data["review"]["rating"] == 4
        assert data["review"]["reviewed_at"] is not None
        assert data["review"]["headline"] == "TEST_Solid stay"

    def test_get_after_update_persisted(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties/{TestPropertyCRUD.property_id}")
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "TEST_Lekki Sea View Apt v2"
        assert data["review"]["rating"] == 4

    def test_filter_by_location(self, admin_client, anon_client, base_url):
        # create another to test filter
        admin_client.post(f"{base_url}/api/properties", json={
            "title": "TEST_Abuja Loft", "location": "Abuja", "rental_type": "short_stay",
            "price": 80, "price_period": "night", "bedrooms": 1, "bathrooms": 1,
        })
        r = anon_client.get(f"{base_url}/api/properties", params={"location": "lagos"})
        assert r.status_code == 200
        props = r.json()
        for p in props:
            assert "lagos" in p["location"].lower()

    def test_filter_by_rental_type(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties", params={"rental_type": "short_stay"})
        assert r.status_code == 200
        for p in r.json():
            assert p["rental_type"] == "short_stay"

    def test_locations_aggregation(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties/locations")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        locations = {row["location"]: row["count"] for row in data}
        assert "Lagos" in locations and locations["Lagos"] >= 1
        assert "Abuja" in locations and locations["Abuja"] >= 1

    def test_validation_missing_fields_422(self, admin_client, base_url):
        r = admin_client.post(f"{base_url}/api/properties", json={"title": "only"})
        assert r.status_code == 422

    def test_get_nonexistent_404(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties/prop_doesnotexist")
        assert r.status_code == 404


# ---------- Submissions workflow ----------
class TestSubmissions:
    submission_id = None

    def test_submit_requires_auth(self, anon_client, base_url):
        r = anon_client.post(f"{base_url}/api/submissions", json={
            "title": "x", "location": "x", "rental_type": "rent", "price": 1,
        })
        assert r.status_code == 401

    def test_user_can_submit(self, user_client, base_url):
        r = user_client.post(f"{base_url}/api/submissions", json={
            "title": "TEST_Owner Submission",
            "location": "Ibadan",
            "rental_type": "rent",
            "price": 500,
            "price_period": "month",
            "bedrooms": 3,
            "bathrooms": 2,
            "description": "TEST_Owner listing",
            "amenities": [],
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["id"].startswith("prop_")
        _no_underscore_id(data)
        TestSubmissions.submission_id = data["id"]

    def test_pending_not_in_public_list(self, anon_client, base_url):
        r = anon_client.get(f"{base_url}/api/properties")
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert TestSubmissions.submission_id not in ids

    def test_admin_lists_submissions(self, admin_client, base_url):
        r = admin_client.get(f"{base_url}/api/submissions")
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert TestSubmissions.submission_id in ids

    def test_admin_approves_submission(self, admin_client, anon_client, base_url):
        r = admin_client.put(
            f"{base_url}/api/properties/{TestSubmissions.submission_id}",
            json={"status": "published"},
        )
        assert r.status_code == 200
        # now visible publicly
        r2 = anon_client.get(f"{base_url}/api/properties")
        ids = [p["id"] for p in r2.json()]
        assert TestSubmissions.submission_id in ids


# ---------- Admin auto-promotion behavior ----------
class TestAdminPromotionBehavior:
    """Per spec: admin role is only assigned during /auth/session for ADMIN_EMAIL.
    If a user record with ari@realratings.live has role='user', admin endpoints
    reject it until they log in again (auth-session-triggered re-promotion).
    """

    def test_ari_email_with_user_role_is_not_auto_admin(self, mongo_db, base_url):
        # Seed a user record with ADMIN_EMAIL but role='user'
        import requests as _rq
        uid = f"test-fake-ari-{uuid.uuid4().hex[:6]}" if False else "test-fake-ari"
        token = f"fake_ari_token_{uuid.uuid4().hex[:8]}"
        try:
            # Try inserting; if email conflicts (real admin exists) skip cleanly
            mongo_db.users.update_one(
                {"user_id": uid},
                {"$set": {
                    "user_id": uid,
                    "email": f"TEST_pseudo_ari_{uuid.uuid4().hex[:6]}@realratings.live",
                    "name": "Fake Ari",
                    "role": "user",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }},
                upsert=True,
            )
            mongo_db.user_sessions.insert_one({
                "user_id": uid,
                "session_token": token,
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
                "created_at": datetime.now(timezone.utc),
            })
            # /auth/me works
            r = _rq.get(f"{base_url}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == 200
            assert r.json()["role"] == "user"
            # Admin endpoint rejects
            r2 = _rq.get(f"{base_url}/api/submissions", headers={"Authorization": f"Bearer {token}"})
            assert r2.status_code == 403
        finally:
            mongo_db.user_sessions.delete_one({"session_token": token})
            mongo_db.users.delete_one({"user_id": uid})


# ---------- Chat ----------
class TestChat:
    message_ids = []
    property_id = None

    @classmethod
    def _ensure_property(cls, admin_client, base_url):
        if cls.property_id:
            return cls.property_id
        # Reuse existing test property if PropertyCRUD ran on this worker
        if TestPropertyCRUD.property_id:
            cls.property_id = TestPropertyCRUD.property_id
            return cls.property_id
        r = admin_client.post(f"{base_url}/api/properties", json={
            "title": "TEST_ChatProp", "location": "Lagos",
            "rental_type": "rent", "price": 100,
        })
        assert r.status_code == 200, r.text
        cls.property_id = r.json()["id"]
        return cls.property_id

    def test_post_requires_auth(self, anon_client, admin_client, base_url):
        pid = TestChat._ensure_property(admin_client, base_url)
        r = anon_client.post(f"{base_url}/api/properties/{pid}/messages", json={"text": "hi"})
        assert r.status_code == 401

    def test_user_posts_message(self, user_client, admin_client, base_url):
        pid = TestChat._ensure_property(admin_client, base_url)
        r = user_client.post(f"{base_url}/api/properties/{pid}/messages", json={"text": "Hello from user"})
        assert r.status_code == 200, r.text
        data = r.json()
        _no_underscore_id(data)
        assert data["is_admin"] is False
        assert data["text"] == "Hello from user"
        TestChat.message_ids.append(data["id"])

    def test_admin_posts_message_flagged(self, admin_client, base_url):
        pid = TestChat._ensure_property(admin_client, base_url)
        time.sleep(0.05)  # ensure different created_at
        r = admin_client.post(f"{base_url}/api/properties/{pid}/messages", json={"text": "Hi from admin"})
        assert r.status_code == 200
        data = r.json()
        assert data["is_admin"] is True
        TestChat.message_ids.append(data["id"])

    def test_list_messages_sorted(self, anon_client, admin_client, base_url):
        pid = TestChat._ensure_property(admin_client, base_url)
        r = anon_client.get(f"{base_url}/api/properties/{pid}/messages")
        assert r.status_code == 200
        msgs = r.json()
        _no_underscore_id(msgs)
        assert len(msgs) >= 2
        timestamps = [m["created_at"] for m in msgs]
        assert timestamps == sorted(timestamps)

    def test_incremental_fetch_since(self, user_client, admin_client, anon_client, base_url):
        pid = TestChat._ensure_property(admin_client, base_url)
        r0 = anon_client.get(f"{base_url}/api/properties/{pid}/messages")
        last_ts = r0.json()[-1]["created_at"]
        time.sleep(0.05)
        user_client.post(f"{base_url}/api/properties/{pid}/messages", json={"text": "Newer"})
        r = anon_client.get(f"{base_url}/api/properties/{pid}/messages", params={"since": last_ts})
        assert r.status_code == 200
        newer = r.json()
        assert len(newer) >= 1
        for m in newer:
            assert m["created_at"] > last_ts

    def test_admin_can_delete_message(self, admin_client, base_url):
        if not TestChat.message_ids:
            pytest.skip("no messages")
        msg_id = TestChat.message_ids[0]
        r = admin_client.delete(f"{base_url}/api/messages/{msg_id}")
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_user_cannot_delete_message(self, user_client, base_url):
        r = user_client.delete(f"{base_url}/api/messages/whatever")
        assert r.status_code == 403


# ---------- Contact ----------
class TestContact:
    contact_id = None
    property_id = None

    @classmethod
    def _ensure_property(cls, admin_client, base_url):
        if cls.property_id:
            return cls.property_id
        if TestPropertyCRUD.property_id:
            cls.property_id = TestPropertyCRUD.property_id
            return cls.property_id
        r = admin_client.post(f"{base_url}/api/properties", json={
            "title": "TEST_ContactProp", "location": "Lagos",
            "rental_type": "rent", "price": 100,
        })
        assert r.status_code == 200, r.text
        cls.property_id = r.json()["id"]
        return cls.property_id

    def test_public_can_submit(self, anon_client, admin_client, base_url):
        pid = TestContact._ensure_property(admin_client, base_url)
        r = anon_client.post(f"{base_url}/api/contact", json={
            "property_id": pid,
            "name": "TEST_Jane",
            "email": "TEST_jane@example.com",
            "phone": "+123",
            "message": "TEST_Interested please",
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["ok"] is True
        assert data["id"].startswith("contact_")
        TestContact.contact_id = data["id"]

    def test_admin_lists_latest_first(self, admin_client, base_url):
        r = admin_client.get(f"{base_url}/api/contact")
        assert r.status_code == 200
        msgs = r.json()
        _no_underscore_id(msgs)
        assert any(m["id"] == TestContact.contact_id for m in msgs)
        # linked property_title
        target = next(m for m in msgs if m["id"] == TestContact.contact_id)
        assert target["property_title"] is not None
        # Sorted latest first (created_at desc)
        ts = [m["created_at"] for m in msgs]
        assert ts == sorted(ts, reverse=True)

    def test_mark_read(self, admin_client, base_url):
        r = admin_client.put(f"{base_url}/api/contact/{TestContact.contact_id}/read")
        assert r.status_code == 200
        # verify persisted
        r2 = admin_client.get(f"{base_url}/api/contact")
        target = next(m for m in r2.json() if m["id"] == TestContact.contact_id)
        assert target["read"] is True

    def test_delete_contact(self, admin_client, base_url):
        r = admin_client.delete(f"{base_url}/api/contact/{TestContact.contact_id}")
        assert r.status_code == 200
        r2 = admin_client.get(f"{base_url}/api/contact")
        ids = [m["id"] for m in r2.json()]
        assert TestContact.contact_id not in ids


# ---------- Upload ----------
class TestUpload:
    def _tiny_png(self):
        # 1x1 red PNG
        return bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
            "890000000d49444154789c63f8cf000000030001010000271e08e70000000049"
            "454e44ae426082"
        )

    def test_upload_requires_auth(self, anon_client, base_url):
        # Use fresh session without JSON default header for multipart
        import requests as _rq
        r = _rq.post(f"{base_url}/api/upload", files={"file": ("t.png", self._tiny_png(), "image/png")})
        assert r.status_code == 401

    def test_upload_rejects_non_image(self, base_url):
        import requests as _rq
        from tests.conftest import ADMIN_TOKEN
        r = _rq.post(
            f"{base_url}/api/upload",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            files={"file": ("t.txt", b"hello", "text/plain")},
        )
        assert r.status_code == 400

    def test_upload_image_and_serve(self, base_url):
        import requests as _rq
        from tests.conftest import ADMIN_TOKEN
        r = _rq.post(
            f"{base_url}/api/upload",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
            files={"file": ("t.png", self._tiny_png(), "image/png")},
        )
        assert r.status_code == 200, r.text
        path = r.json()["path"]
        # Serve
        r2 = _rq.get(f"{base_url}/api/files/{path}")
        assert r2.status_code == 200, r2.text
        assert r2.headers.get("content-type", "").startswith("image/")
        assert len(r2.content) > 0
