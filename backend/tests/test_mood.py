"""
Phase 7 — Mood Check-in API Tests
Tests: POST /mood, GET /mood/today, GET /mood/history
"""
import httpx

BASE = "http://127.0.0.1:8000/api/v1"


def get_token(username: str, password: str) -> str:
    r = httpx.post(f"{BASE}/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["access_token"]


def test_mood():
    print("Testing mood endpoints...")

    bf_token = get_token("boyfriend", "love123")
    gf_token = get_token("girlfriend", "love123")

    bf_headers = {"Authorization": f"Bearer {bf_token}"}
    gf_headers = {"Authorization": f"Bearer {gf_token}"}

    # 1 — Boyfriend submits mood
    r = httpx.post(f"{BASE}/mood", json={"mood": "happy", "note": "Feeling great today!"}, headers=bf_headers)
    print(f"BF mood POST status: {r.status_code}")
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    bf_checkin = r.json()
    print(f"BF check-in: {bf_checkin}")
    assert bf_checkin["mood"] == "happy"

    # 2 — BF updates same day (should upsert)
    r = httpx.post(f"{BASE}/mood", json={"mood": "excited", "note": "Upgraded!"}, headers=bf_headers)
    print(f"BF mood UPSERT status: {r.status_code}")
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    upserted = r.json()
    assert upserted["mood"] == "excited", "Upsert should have updated mood"

    # 3 — Girlfriend submits mood
    r = httpx.post(f"{BASE}/mood", json={"mood": "loved", "note": "💕"}, headers=gf_headers)
    print(f"GF mood POST status: {r.status_code}")
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    gf_checkin = r.json()
    assert gf_checkin["mood"] == "loved"

    # 4 — Get today's moods (both sides visible to BF)
    r = httpx.get(f"{BASE}/mood/today", headers=bf_headers)
    print(f"Today moods status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    today = r.json()
    print(f"Today moods: {today}")
    assert today["boyfriend"] is not None, "BF mood should be present"
    assert today["girlfriend"] is not None, "GF mood should be present"
    assert today["boyfriend"]["mood"] == "excited"
    assert today["girlfriend"]["mood"] == "loved"

    # 5 — History for BF (at least 1 record)
    r = httpx.get(f"{BASE}/mood/history?days=7", headers=bf_headers)
    print(f"History status: {r.status_code}")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    history = r.json()
    assert len(history) >= 1, "Should have at least today's check-in"

    print("\nAll mood API tests passed! ✅")


if __name__ == "__main__":
    test_mood()
