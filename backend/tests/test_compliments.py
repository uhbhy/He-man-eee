import asyncio
import httpx

async def test_compliments():
    print("Testing compliments endpoints...")
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Login to get token
        login_resp = await client.post("/api/v1/auth/login", json={"username": "girlfriend", "password": "love123"})
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get random compliment
        rand_resp = await client.get("/api/v1/compliments/random", headers=headers)
        print("Random compliment status:", rand_resp.status_code)
        assert rand_resp.status_code == 200
        compliment = rand_resp.json()
        print("Random compliment:", compliment)
        assert "message" in compliment
        assert compliment["is_active"] == True
        
        # 3. List all compliments
        list_resp = await client.get("/api/v1/compliments", headers=headers)
        print("List compliments status:", list_resp.status_code)
        assert list_resp.status_code == 200
        compliments = list_resp.json()
        print(f"Total compliments found: {len(compliments)}")
        assert len(compliments) == 20  # seeded count
        
        print("All compliments API tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_compliments())
