# Couples Web App — Startup & Testing Guide

This guide walks you through setting up, running, and testing the entire Couples Web Application.

---

## 1. Prerequisites

Ensure you have the following installed:
*   **Python 3.11+**
*   **Node.js 18+**
*   **PostgreSQL** (running locally on port `5432` with a database named `couples_db`)

---

## 2. Backend Setup & Startup

1.  **Navigate to the backend directory**:
    ```powershell
    cd d:\he-man-eee\backend
    ```

2.  **Verify the `.env` Configuration**:
    Make sure your `d:\he-man-eee\backend\.env` file matches your local PostgreSQL credentials. Example:
    ```env
    DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/couples_db
    SECRET_KEY=9e87515f48b9415c898c603a110a19e5d799042b93cf476bbd475bc374a4cf02
    ACCESS_TOKEN_EXPIRE_MINUTES=1440
    WHATSAPP_API_TOKEN=mock_whatsapp_token
    WHATSAPP_PHONE_NUMBER_ID=mock_phone_number_id
    GIRLFRIEND_WHATSAPP_NUMBER=919999999999
    MEDIA_UPLOAD_DIR=./uploads
    ```

3.  **Run Database Migrations**:
    Apply the database schema using Alembic:
    ```powershell
    venv\Scripts\alembic upgrade head
    ```

4.  **Seed the Database**:
    Initialize default users (`boyfriend`/`Juliet` and `girlfriend`/`Romeo`), seed questions, compliments, and sample wishlist items:
    ```powershell
    venv\Scripts\python seed.py
    ```

5.  **Start the Uvicorn Server**:
    Launch the backend FastAPI application:
    ```powershell
    venv\Scripts\uvicorn app.main:app --reload
    ```
    The API will now be running at `http://127.0.0.1:8000`.

---

## 3. Frontend Setup & Startup

1.  **Navigate to the frontend directory**:
    ```powershell
    cd d:\he-man-eee\frontend
    ```

2.  **Install dependencies** (if not already done):
    ```powershell
    npm install
    ```

3.  **Start the Development Server**:
    Launch the Vite development server:
    ```powershell
    npm run dev
    ```
    The web app will now be accessible at `http://localhost:5173`.

---

## 4. Testing All Functionalities

With the backend server running at `http://127.0.0.1:8000`, open a new terminal window in `d:\he-man-eee\backend` and run the suite of automated integration scripts to test every feature:

*   **Test Authentication**:
    ```powershell
    $env:PYTHONIOENCODING="utf-8"; venv\Scripts\python tests/test_auth.py
    ```
*   **Test Wishlist (Bucket List) CRUD**:
    ```powershell
    $env:PYTHONIOENCODING="utf-8"; venv\Scripts\python tests/test_wishlist.py
    ```
*   **Test Mood Check-in**:
    ```powershell
    $env:PYTHONIOENCODING="utf-8"; venv\Scripts\python tests/test_mood.py
    ```
*   **Test WhatsApp Virtual Alerts**:
    ```powershell
    $env:PYTHONIOENCODING="utf-8"; venv\Scripts\python tests/test_whatsapp.py
    ```

---

## 5. Visual Walkthrough & Features

Access `http://localhost:5173` in your browser:
1.  **Login**: Authenticate as Romeo (`boyfriend` / `love123`) or Juliet (`girlfriend` / `love123`).
2.  **Home Dashboard**: View your partner's status, send instant Hugs/Kisses, check active wishlist items, and review recent trivia scores.
3.  **Quiz Page**: Challenge your partner with interactive trivia, flip question cards, and save score history.
4.  **Moments Gallery**: Upload images/videos (supports files up to 50MB) and view them in a masonry grid with a full-screen lightbox.
5.  **Bucket List**: Filter by Date Ideas or Places, mark items done, and add new dreams.
6.  **Mood Check-in**: Log how you feel, write notes, and look at your daily status.
