import asyncio
import httpx

async def test_wishlist():
    print("Testing wishlist endpoints...")
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Login as Romeo (Boyfriend)
        bf_login = await client.post("/api/v1/auth/login", json={"username": "boyfriend", "password": "love123"})
        bf_token = bf_login.json()["access_token"]
        bf_headers = {"Authorization": f"Bearer {bf_token}"}
        
        # 2. Login as Juliet (Girlfriend)
        gf_login = await client.post("/api/v1/auth/login", json={"username": "girlfriend", "password": "love123"})
        gf_token = gf_login.json()["access_token"]
        gf_headers = {"Authorization": f"Bearer {gf_token}"}
        
        # 3. Boyfriend creates item
        payload = {"title": "Watch the sunset at the beach 🌅", "description": "Drive down to Santa Monica and watch the sunset together.", "category": "date_idea"}
        create_resp = await client.post("/api/v1/wishlist", json=payload, headers=bf_headers)
        print("Create status:", create_resp.status_code)
        assert create_resp.status_code == 201
        item = create_resp.json()
        print("Created Wishlist Item:", item)
        item_id = item["id"]
        assert item["is_done"] == False
        
        # 4. List items (check filters)
        list_resp = await client.get("/api/v1/wishlist?category=date_idea", headers=gf_headers)
        print("List (filtered) status:", list_resp.status_code)
        assert list_resp.status_code == 200
        items = list_resp.json()
        assert len(items) >= 1
        assert items[0]["id"] == item_id
        
        # 5. Toggle done state
        done_resp = await client.patch(f"/api/v1/wishlist/{item_id}/done", headers=gf_headers)
        print("Done toggle status:", done_resp.status_code)
        assert done_resp.status_code == 200
        done_item = done_resp.json()
        print("Toggled done item:", done_item)
        assert done_item["is_done"] == True
        assert done_item["done_at"] is not None
        
        # 6. Juliet tries to delete Romeo's wishlist item (expect 403)
        del_gf_resp = await client.delete(f"/api/v1/wishlist/{item_id}", headers=gf_headers)
        print("GF delete status (expect 403):", del_gf_resp.status_code)
        assert del_gf_resp.status_code == 403
        
        # 7. Romeo deletes his wishlist item (expect 200)
        del_bf_resp = await client.delete(f"/api/v1/wishlist/{item_id}", headers=bf_headers)
        print("BF delete status (expect 200):", del_bf_resp.status_code)
        assert del_bf_resp.status_code == 200
        
        # 8. List again, verify deleted is missing
        list2_resp = await client.get("/api/v1/wishlist", headers=bf_headers)
        items2 = list2_resp.json()
        ids = [i["id"] for i in items2]
        assert item_id not in ids
        
        print("All wishlist API tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_wishlist())
