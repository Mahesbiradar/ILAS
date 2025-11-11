"""
library/views_task_status.py

Simple view to check background task status.
Supports Celery's AsyncResult if Celery is available; otherwise returns a helpful message.
"""

from django.http import JsonResponse

try:
    from celery.result import AsyncResult  # type: ignore
    CELERY_AVAILABLE = True
except Exception:
    CELERY_AVAILABLE = False


def task_status_view(request, task_id: str):
    """
    Returns status information for a background task.
    - If Celery is available, returns AsyncResult status + result (if ready).
    - If not available, returns informative fallback JSON.
    """
    if CELERY_AVAILABLE:
        try:
            res = AsyncResult(task_id)
            data = {
                "task_id": task_id,
                "status": res.status,
                "ready": res.ready(),
                "successful": res.successful(),
            }
            if res.ready():
                try:
                    data["result"] = res.result
                except Exception:
                    data["result"] = "Unserializable result or retrieval error."
            return JsonResponse(data)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)
    else:
        # Celery not installed — return a stable message so frontend can handle it gracefully.
        return JsonResponse({
            "task_id": task_id,
            "status": "CELERY_NOT_AVAILABLE",
            "ready": False,
            "message": "Celery (or AsyncResult) is not available in this environment. "
                       "If you expected async tasks, install/configure Celery or run tasks synchronously."
        }, status=200)
