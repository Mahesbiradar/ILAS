# library/tasks.py
import uuid
import traceback
from datetime import timedelta
from celery import shared_task
from django.core.cache import cache
from django.utils import timezone

# No need to import BookCopy or barcode utilities now
# from .models import BookCopy

# ======================================================================
# 📊 GENERIC TASK ID + PROGRESS HELPERS
# ======================================================================
def create_task_id(prefix="TASK"):
    """Generate a unique task identifier."""
    return f"{prefix}-{uuid.uuid4()}"


def update_task_progress(task_id, progress, message="", status="IN_PROGRESS"):
    """Update progress in Redis cache (1h timeout)."""
    data = {"progress": progress, "status": status, "message": message}
    cache.set(task_id, data, timeout=3600)
    print(f"[PROGRESS] {task_id}: {progress}% - {message}")


def get_task_progress(task_id):
    """Fetch task progress safely."""
    return cache.get(task_id, {"progress": 0, "status": "PENDING", "message": ""})


# ======================================================================
# 🔍 REDIS / CELERY HEALTH CHECK
# ======================================================================
def is_redis_available():
    """Check if Redis broker is reachable."""
    try:
        from redis import Redis
        from django.conf import settings

        client = Redis.from_url(
            getattr(settings, "CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")
        )
        client.ping()
        return True
    except Exception:
        return False


# ======================================================================
# 🧠 SAFE CELERY CALL WRAPPER
# ======================================================================
def safe_celery_call(task_func, *args, **kwargs):
    """
    Dispatch Celery task if broker available, else run synchronously.
    For bound Celery tasks (bind=True), use task_func.run for sync fallback.
    """
    try:
        task_func.delay(*args, **kwargs)
        print(
            f"[SAFE CELERY] ✅ Task sent asynchronously: {getattr(task_func, 'name', getattr(task_func, '__name__', str(task_func)))}"
        )
        return {"dispatched": True}
    except Exception as e:
        print(
            f"[SAFE CELERY] ⚠️ Celery unavailable — running sync for {getattr(task_func, '__name__', getattr(task_func, 'name', str(task_func)))}: {e}"
        )
        try:
            runner = getattr(task_func, "run", task_func)
            return runner(*args, **kwargs)
        except Exception as inner:
            print(f"[SAFE CELERY] ❌ Sync execution failed: {inner}")
            traceback.print_exc()
            return {"error": str(inner)}


# ======================================================================
# 🗂️ HOUSEKEEPING TASKS
# ======================================================================
@shared_task(name="archive_old_transactions")
def archive_old_transactions():
    """
    Archive transactions older than 6 months (placeholder).
    Extend this function once Transaction models are implemented.
    """
    six_months_ago = timezone.now() - timedelta(days=180)
    print("[ARCHIVE] Placeholder — no active transaction model yet.")
    return {"archived": 0}
