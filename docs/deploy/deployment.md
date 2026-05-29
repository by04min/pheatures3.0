# Deployment

The app is split across two hosting platforms: **Render** for the backend and **Vercel** for the frontend.

---

## Backend — Render

The Flask API is deployed as a **Web Service** on [Render](https://render.com).

**Live URL:** `https://pheatures3-0.onrender.com`

### How it works

1. Render pulls the repo from GitHub on every push to `main`.
2. It installs Python dependencies from `backend/requirements.txt` using pip.
3. Gunicorn starts the app with something like `gunicorn backend.app:app`.
4. On startup, `init_db.py` is called automatically — it creates the SQLite schema and seeds all tables from the CSV files in `data/` if the database is empty. This means no manual migration step is needed after a deploy.

### Key files

| File | Purpose |
|---|---|
| `backend/app.py` | Flask app entrypoint; calls `init_db()` on startup |
| `backend/init_db.py` | Creates schema + seeds DB from CSVs on first boot |
| `backend/requirements.txt` | Python dependencies (includes `gunicorn` and `flask-cors`) |
| `data/*.csv` | Source data the DB is seeded from |

### Notes

- The SQLite database (`pheatures.db`) is not committed to the repo — it is generated at runtime from the CSV files.
- `flask-cors` is enabled globally so the Vercel frontend can make cross-origin requests to the Render backend.
- Render's free tier spins down after inactivity; the first request after a cold start may be slow.

---

## Frontend — Vercel

The React/Vite app is deployed on [Vercel](https://vercel.com).

**Live URL:** `https://pheatures30.vercel.app`

### How it works

1. Vercel pulls the repo from GitHub on every push to `main`.
2. It runs `vite build` inside the `frontend/` directory, which compiles the React app into static files.
3. Vercel serves those static files globally via its CDN.
4. At build time, Vite bakes the `VITE_API_BASE_URL` environment variable into the bundle — this tells the frontend where to find the backend API.

### Key files

| File | Purpose |
|---|---|
| `frontend/src/` | React source code |
| `frontend/vite.config.js` | Vite config; proxies `/api` to `localhost:5000` in dev |
| `frontend/.env.example` | Template showing which env vars need to be set |

### Environment variables

Set these in the **Vercel dashboard** (Project Settings → Environment Variables):

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://pheatures3-0.onrender.com/api` |

### Notes

- In development, `VITE_API_BASE_URL` is intentionally unset — Vite's dev server proxies `/api` requests to `localhost:5000` instead.
- In production, the Vite build picks up `VITE_API_BASE_URL` from Vercel's environment and hardcodes it into the bundle.
