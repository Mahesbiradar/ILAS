# library/views_task_status.py
from django.http import JsonResponse
from celery.result import AsyncResult

def task_status_view(request, task_id):
    """
    Returns real-time status of any Celery task (e.g., bulk upload, report generation, etc.).
    """
    try:
        result = AsyncResult(task_id)
        response_data = {
            "task_id": task_id,
            "status": result.status,
            "successful": result.successful(),
            "ready": result.ready(),
        }
        if result.ready():
            try:
                response_data["result"] = result.result
            except Exception:
                response_data["result"] = "Result unavailable or not serializable."
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
