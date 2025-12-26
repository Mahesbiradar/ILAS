"""
library/tasks.py

Safe background task helpers for ILAS.
- Works with Celery if available, otherwise falls back to synchronous execution.
- Small helpers for task id and progress (cache-based).
"""

import uuid
import traceback
from typing import Any, Callable, Dict

from django.core.cache import cache
from django.conf import settings

# Try import Celery's shared_task if Celery is installed.
try:
    from celery import shared_task  # type: ignore
    CELERY_AVAILABLE = True
except Exception:
    shared_task = None  # type: ignore
    CELERY_AVAILABLE = False


def create_task_id(prefix: str = "TASK") -> str:
    """Generate a unique task id."""
    return f"{prefix}-{uuid.uuid4()}"


def update_task_progress(task_id: str, progress: int, message: str = "", status: str = "IN_PROGRESS") -> None:
    """Store task progress in Django cache (useful for polled UI)."""
    data = {"progress": int(progress), "status": status, "message": message}
    cache.set(task_id, data, timeout=3600)


def get_task_progress(task_id: str) -> Dict[str, Any]:
    """Retrieve progress data for a given task id (returns a default if none)."""
    return cache.get(task_id, {"progress": 0, "status": "PENDING", "message": ""})


def is_celery_available() -> bool:
    """Return whether Celery is importable and usable."""
    return CELERY_AVAILABLE


def safe_celery_call(task_func: Callable[..., Any], *args, **kwargs) -> Dict[str, Any]:
    """
    Dispatch a Celery task if Celery available, otherwise run sync.
    - If task_func is a Celery task (has .delay), call .delay
    - On exception, fallback to running the function synchronously.
    Returns a dict describing dispatch result or function return.
    """
    task_name = getattr(task_func, "name", getattr(task_func, "__name__", str(task_func)))
    try:
        if CELERY_AVAILABLE and hasattr(task_func, "delay"):
            # call asynchronously
            result = task_func.delay(*args, **kwargs)  # type: ignore
            return {"dispatched": True, "task_id": getattr(result, "id", None)}
        else:
            # run sync
            result = None
            try:
                # If it's a bound Celery task object with run method, call run
                runner = getattr(task_func, "run", task_func)
                result = runner(*args, **kwargs)
            except TypeError:
                result = task_func(*args, **kwargs)
            return {"dispatched": False, "result": result}
    except Exception as exc:
        # fallback: run synchronously and capture exception
        try:
            runner = getattr(task_func, "run", task_func)
            result = runner(*args, **kwargs)
            return {"dispatched": False, "result": result}
        except Exception as inner:
            traceback.print_exc()
            return {"error": str(inner)}


# Example Celery task (uncomment if you want to use Celery and register this)
# if CELERY_AVAILABLE:
#     @shared_task(name="library.generate_inventory_report")
#     def generate_inventory_report():
#         # Example task: compute inventory snapshot and save to a file or DB
#         # Return a small result (status) for the demo
#         return {"status": "ok"}

from django.db.models import Sum, Count, Q
from django.core.cache import cache
from decimal import Decimal
from django.utils import timezone
from .models import Book, BookTransaction

DASHBOARD_CACHE_KEY = "ilas_dashboard_stats"

def recompute_dashboard_stats():
    data = {
        "total_books": Book.objects.filter(is_active=True).count(),
        "issued_count": Book.objects.filter(status=Book.STATUS_ISSUED).count(),
        "overdue_count": BookTransaction.objects.filter(
            txn_type=BookTransaction.TYPE_ISSUE,
            is_active=True,
            due_date__lt=timezone.now(),
        ).count(),
        "total_unpaid_fines": str(
            BookTransaction.objects.filter(is_active=True, fine_amount__gt=0)
            .aggregate(total=Sum("fine_amount"))["total"]
            or Decimal("0.00")
        ),
    }
    cache.set(DASHBOARD_CACHE_KEY, data, timeout=300)
    return data

def invalidate_dashboard_cache():
    cache.delete("ilas_dashboard_stats")