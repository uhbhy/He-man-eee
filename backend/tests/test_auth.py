import asyncio
import httpx

async def test_auth():
    print("Testing auth endpoints...")
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Test Login
        login_data = {"username": "boyfriend", "password": "love123"}
        response = await client.post("/api/v1/auth/login", json=login_data)
        print("Login response status:", response.status_code)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        token_info = response.json()
        print("Token received:", "Yes" if "access_token" in token_info else "No")
        print("User profile in response:", token_info["user"])
        
        access_token = token_info["access_token"]
        
        # 2. Test Get Me with valid token
        headers = {"Authorization": f"Bearer {access_token}"}
        me_response = await client.get("/api/v1/auth/me", headers=headers)
        print("Me response status:", me_response.status_code)
        assert me_response.status_code == 200
        me_info = me_response.json()
        print("Me profile:", me_info)
        assert me_info["username"] == "boyfriend"
        
        # 3. Test Get Me with invalid token
        invalid_headers = {"Authorization": "Bearer invalid_token_here"}
        bad_response = await client.get("/api/v1/auth/me", headers=invalid_headers)
        print("Me response with bad token status:", bad_response.status_code)
        assert bad_response.status_code == 401
        
        print("All auth tests passed successfully! 🎉")

if __name__ == "__main__":
    asyncio.run(test_auth())
