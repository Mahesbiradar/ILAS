<!-- Copilot / AI Agent instructions for the ILAS codebase -->

# ILAS — Quick AI assistant guidance

This file gives focused, actionable information to help an AI coding agent become productive in this repository.

1. Project overview

- **Backend**: Django REST API in `backend/` (project `ilas_backend`). Key files: `backend/manage.py`, `backend/ilas_backend/settings.py`.
- **Frontend**: Vite + React app in `frontend/`. Key file: `frontend/package.json` (dev server: `npm run dev` on port 5173).
- **Background jobs**: Celery integration in `backend/ilas_backend/celery.py`. Task helpers and safe fallbacks are in `backend/library/tasks.py`.

2. Important runtime and integration points

- **Auth**: JWT (DRF SimpleJWT). Default permission class is `IsAuthenticated` (see `REST_FRAMEWORK` in `settings.py`).
- **API docs/schema**: drf-spectacular configured; `SPECTACULAR_SETTINGS.SCHEMA_PATH_PREFIX` is `/api/v1/`.
- **Database**: `settings.py` is configured for PostgreSQL by default (NAME `ilas_db`, host `localhost:5432`). There is a `db.sqlite3` file in the repo — note that the active settings expect Postgres; adjust `DATABASES` if you want sqlite locally.
- **Media & templates**: `MEDIA_ROOT` is `media/`; templates path includes `BASE_DIR / "templates"` (must be present for server-side views).
- **CORS**: `CORS_ALLOWED_ORIGINS` includes `http://localhost:5173` (frontend dev port) and `CORS_ALLOW_ALL_ORIGINS = True`.
- **Celery**: broker & results use Redis `redis://127.0.0.1:6379/0` (see settings). Celery beat schedule references `library.tasks` entries.

3. Common developer commands (copyable)

- Backend: install deps, run migrations, start dev server

```powershell
cd backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

- Frontend: run dev server

```powershell
cd frontend
npm install
npm run dev
```

- Celery (requires Redis running locally)

```powershell
# Start a worker
celery -A ilas_backend worker -l info
# Start beat scheduler
celery -A ilas_backend beat -l info
# Or use Docker for Redis: docker run -p 6379:6379 redis
```

4. Testing and QA

- Django tests: `python manage.py test` (unit tests found under `backend/library/` and `backend/accounts/`). Example files: `library/test_api_endpoints.py`, `library/test_library.py`.
- When changing models: `python manage.py makemigrations` then `python manage.py migrate`.

5. Project-specific patterns and conventions

- Tasks: `library/tasks.py` exposes `safe_celery_call()` which will dispatch to Celery if available or run functions synchronously — prefer using this helper for background work so local dev works without Redis.
- JWT + DRF: API endpoints assume token auth; many views rely on `request.user` and `IsAuthenticated` default permission. For public endpoints, look for explicit permission overrides in view code.
- Pagination & filtering: Default page size is 20; `SearchFilter` and `OrderingFilter` are used widely. Keep responses paginated for list endpoints.
- Static/media assets: uploads (barcodes, covers, profile images) are in `media/` and code uses `MEDIA_URL` paths — tests expect files in `media/`.

6. Files and locations to inspect for context when making changes

- `backend/ilas_backend/settings.py` — central config (DB, CORS, JWT, Celery, MEDIA, TIMEZONE)
- `backend/ilas_backend/celery.py` — celery bootstrapping and autodiscover behavior
- `backend/library/tasks.py` — safe task helpers and example patterns
- `backend/accounts/` and `backend/library/` apps — models, serializers, views show common conventions
- `frontend/src/` — React components and API usage (look for axios usage for example request patterns)

7. Safety notes for AI agents (do not guess; confirm)

- Do not change `SECRET_KEY` in `settings.py` lightly — it is present in repo for dev but production should use env vars.
- Confirm database changes with migrations before editing other files.
- If you add Celery tasks, ensure `library/tasks.py` is updated and fallback behavior remains for local dev.

If anything in this summary is unclear or you want it expanded (e.g., CI commands, deployment steps, or CONTRIBUTING conventions), tell me which area to expand and I will iterate.
