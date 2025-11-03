# library/views_task_status.py
from django.http import JsonResponse
from django_celery_results.models import TaskResult
from celery.result import AsyncResult

def task_status_view(request, task_id):
    """
    Returns the status and result (if ready) of a Celery task.
    """
    try:
        result = AsyncResult(task_id)
        response_data = {
            "task_id": task_id,
            "status": result.status,
        }
        if result.ready():
            response_data["result"] = result.result
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
