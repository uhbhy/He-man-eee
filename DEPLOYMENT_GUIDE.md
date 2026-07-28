# Deployment & Setup Guide (Render + Free Postgres + ImageKit + Gmail SMTP)

This guide walks you step-by-step through deploying the full application to Render for free.

---

## 1. Prerequisites & Services Required

1. **GitHub Account**: A free account to host your repository.
2. **Render Account**: Create a free account at [render.com](https://render.com).
3. **Free PostgreSQL Database**:
   - *Note*: Render's free PostgreSQL databases expire after 30 days.
   - **Recommended Free Alternatives**:
     - [Neon Postgres](https://neon.tech) (Free tier with no 30-day deletion limit)
     - [Supabase](https://supabase.com) (Free tier PostgreSQL)
4. **ImageKit Account**: For storing photos/videos persistently.
5. **Gmail App Password**: For sending email notifications.

---

## 2. Setting Up External Services

### A. Gmail App Password (SMTP)
1. Go to your Google Account -> **Security** -> **2-Step Verification** (Enable if not already enabled).
2. Scroll to **App passwords**.
3. Create a new App Password (e.g. named "Couples App") and copy the 16-character generated code.

### B. ImageKit Credentials
1. Sign up/log in at [imagekit.io](https://imagekit.io).
2. Under **Developer Options / API Keys**, copy:
   - Public Key (`public_...`)
   - Private Key (`private_...`)
   - URL Endpoint (`https://ik.imagekit.io/...`)

### C. PostgreSQL Database (Neon or Supabase)
1. Create a project on Neon or Supabase.
2. Copy the Connection String URI (e.g. `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
3. Convert the prefix from `postgresql://` to `postgresql+asyncpg://` for SQLAlchemy async support.

---

## 3. GitHub Setup (Local to Cloud)

If your project is not yet on GitHub, run these commands in your terminal at `d:\he-man-eee`:

```bash
git init
git add .
git commit -m "Initial commit with deployment configuration"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 4. Deploying Backend Web Service on Render

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Fill out the service configuration:
   - **Name**: `couples-app-backend`
   - **Region**: Choose closest to you.
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
5. Expand **Environment Variables** and add:

| Key | Example Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host/dbname?sslmode=require` |
| `SECRET_KEY` | *(generate a random 32-character string)* |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USERNAME` | `yourgmail@gmail.com` |
| `SMTP_PASSWORD` | `your-16-char-app-password` |
| `SMTP_FROM_EMAIL` | `yourgmail@gmail.com` |
| `BOYFRIEND_EMAIL` | `boyfriend@gmail.com` |
| `GIRLFRIEND_EMAIL` | `girlfriend@gmail.com` |
| `IMAGEKIT_PUBLIC_KEY` | `public_...` |
| `IMAGEKIT_PRIVATE_KEY` | `private_...` |
| `IMAGEKIT_URL_ENDPOINT` | `https://ik.imagekit.io/your_id` |
| `IMAGEKIT_UPLOAD_FOLDER` | `/couples-app/moments` |

6. Click **Create Web Service**. Note your backend URL (e.g. `https://couples-app-backend.onrender.com`).

---

## 5. Running Database Migrations & Seeds on Production DB

You can run migrations and seed data directly from your local terminal pointing to your production database URL:

```bash
cd backend
$env:DATABASE_URL="postgresql+asyncpg://user:pass@host/dbname?sslmode=require"
.\venv\Scripts\alembic.exe upgrade head
$env:PYTHONPATH="."
.\venv\Scripts\python.exe .\seeds\seed.py
```

---

## 6. Deploying Frontend Static Site on Render

1. On Render Dashboard, click **New +** -> **Static Site**.
2. Select your GitHub repository.
3. Configure the static site settings:
   - **Name**: `couples-app-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Expand **Environment Variables** and add:
   - `VITE_API_BASE_URL`: `https://couples-app-backend.onrender.com/api/v1` *(your Render backend URL + `/api/v1`)*
5. Click **Create Static Site**.

---

## 7. Verification Checklist

- [ ] Open the frontend URL in browser.
- [ ] Log in with seeded user credentials (`abhi` / `Planet-J+B`).
- [ ] Test **Mood Check-in** -> Verify partner receives notification email.
- [ ] Test **Send Virtual Hug / Kiss** -> Verify notification email.
- [ ] Test **Moments Upload** -> Upload a picture and verify it uploads to ImageKit and displays.
- [ ] Test **Quiz** -> Verify it loads 10 randomized questions.
