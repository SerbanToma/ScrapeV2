# Scrapelight: Backend

Repo for backend service: FastAPI backend with celery worker

## Project layout

```
.
├─ main_api/           # FastAPI app (Dockerized)
├─ ml_worker/          # Celery worker (Dockerized)
├─ frontend/           # React + Vite + TypeScript app (Dockerized)
├─ shared/             # Shared code/config
├─ docker-compose.yml  # Orchestrates services for local dev
```

## Run locally (Docker)

1. Copy envs
   - `cp env.example .env`
   - Frontend uses `VITE_API_BASE_URL` env (default wired in compose)
2. Start services
   - `docker compose up --build`
3. Open
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

## Frontend API

Backend exposes:
- `POST /search/by_picture` (multipart: `file`; query: `store`, `top_k`, `wait`)
- `POST /search/by_specifications` (query: `details`, `bulb_type`, `dimensions`, `category`, `store`, `wait`)

Response shape matches `shared/schemas.py` `SearchResponse`.



