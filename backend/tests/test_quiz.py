import asyncio
import httpx

async def test_quiz():
    print("Testing quiz endpoints...")
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # 1. Login to get token
        login_data = {"username": "boyfriend", "password": "love123"}
        login_resp = await client.post("/api/v1/auth/login", json=login_data)
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get questions
        q_resp = await client.get("/api/v1/quiz/questions", headers=headers)
        print("Questions status:", q_resp.status_code)
        assert q_resp.status_code == 200
        questions = q_resp.json()
        print(f"Loaded {len(questions)} questions.")
        assert len(questions) == 15
        
        # Verify answer is not in keys
        for q in questions:
            assert "answer" not in q, "Security risk: answer is exposed in get_questions!"
            
        # 3. Attempt a question
        test_q = questions[0]
        q_id = test_q["id"]
        # Options are list. Choose option 0.
        selected_option = test_q["options"][0]
        attempt_data = {"question_id": q_id, "selected": selected_option}
        
        attempt_resp = await client.post("/api/v1/quiz/attempt", json=attempt_data, headers=headers)
        print("Attempt status:", attempt_resp.status_code)
        assert attempt_resp.status_code == 200
        attempt_result = attempt_resp.json()
        print("Attempt result:", attempt_result)
        assert "is_correct" in attempt_result
        assert "correct_answer" in attempt_result
        
        # 4. Get score
        score_resp = await client.get("/api/v1/quiz/score", headers=headers)
        print("Score status:", score_resp.status_code)
        assert score_resp.status_code == 200
        score_info = score_resp.json()
        print("Score details:", score_info)
        assert score_info["total"] >= 1
        
        # 5. Get history
        hist_resp = await client.get("/api/v1/quiz/history", headers=headers)
        print("History status:", hist_resp.status_code)
        assert hist_resp.status_code == 200
        history = hist_resp.json()
        print("History size:", len(history))
        assert len(history) >= 1
        assert "question_text" in history[0]
        assert "selected" in history[0]
        assert "is_correct" in history[0]
        
        print("All quiz API tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(test_quiz())
