import asyncio
import httpx
import io

async def test_moments():
    print("Testing moments endpoints...")
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Login as Boyfriend (Romeo)
        bf_login = await client.post("/api/v1/auth/login", json={"username": "boyfriend", "password": "love123"})
        assert bf_login.status_code == 200
        bf_token = bf_login.json()["access_token"]
        bf_headers = {"Authorization": f"Bearer {bf_token}"}
        
        # 2. Login as Girlfriend (Juliet)
        gf_login = await client.post("/api/v1/auth/login", json={"username": "girlfriend", "password": "love123"})
        assert gf_login.status_code == 200
        gf_token = gf_login.json()["access_token"]
        gf_headers = {"Authorization": f"Bearer {gf_token}"}
        
        # 3. Boyfriend uploads a moment
        mock_file_data = b"dummy image data"
        files = {"file": ("love.jpg", io.BytesIO(mock_file_data), "image/jpeg")}
        data = {"caption": "Romeo's first selfie", "taken_at": "2026-06-14"}
        
        upload_resp = await client.post("/api/v1/moments", files=files, data=data, headers=bf_headers)
        print("Upload status:", upload_resp.status_code)
        assert upload_resp.status_code == 201
        moment = upload_resp.json()
        print("Uploaded Moment:", moment)
        assert moment["media_type"] == "photo"
        assert "love.jpg" not in moment["media_url"]  # Should be UUID filename
        moment_id = moment["id"]
        
        # 4. List moments (accessible by both)
        list_resp = await client.get("/api/v1/moments", headers=gf_headers)
        print("List status:", list_resp.status_code)
        assert list_resp.status_code == 200
        moments = list_resp.json()
        assert len(moments) >= 1
        assert moments[0]["id"] == moment_id
        
        # 5. Girlfriend tries to delete Romeo's moment (Should be 403)
        del_gf_resp = await client.delete(f"/api/v1/moments/{moment_id}", headers=gf_headers)
        print("GF delete status (expect 403):", del_gf_resp.status_code)
        assert del_gf_resp.status_code == 403
        
        # 6. Romeo deletes his own moment (Should be 200)
        del_bf_resp = await client.delete(f"/api/v1/moments/{moment_id}", headers=bf_headers)
        print("BF delete status (expect 200):", del_bf_resp.status_code)
        assert del_bf_resp.status_code == 200
        
        # 7. List again, should be empty (or not contain deleted)
        list2_resp = await client.get("/api/v1/moments", headers=bf_headers)
        moments2 = list2_resp.json()
        ids = [m["id"] for m in moments2]
        assert moment_id not in ids
        
        print("All moments API tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_moments())
