"""
Phase 8 — WhatsApp Alert Trigger Tests
"""
import httpx

BASE = "http://127.0.0.1:8000/api/v1"


def get_token(username: str, password: str) -> str:
    r = httpx.post(f"{BASE}/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


def test_whatsapp():
    print("Testing WhatsApp alert trigger...")
    bf_token = get_token("boyfriend", "love123")
    headers = {"Authorization": f"Bearer {bf_token}"}

    # 1 — Trigger virtual hug
    r = httpx.post(f"{BASE}/whatsapp/send", json={"type": "hug"}, headers=headers)
    print(f"Hug post status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(r.json())

    # 2 — Trigger virtual kiss
    r = httpx.post(f"{BASE}/whatsapp/send", json={"type": "kiss"}, headers=headers)
    print(f"Kiss post status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    print(r.json())

    # 3 — Invalid type
    r = httpx.post(f"{BASE}/whatsapp/send", json={"type": "tickle"}, headers=headers)
    print(f"Invalid type status (expected 400): {r.status_code}")
    assert r.status_code == 400

    print("All WhatsApp Alert integration tests passed! ✅")


if __name__ == "__main__":
    test_whatsapp()
