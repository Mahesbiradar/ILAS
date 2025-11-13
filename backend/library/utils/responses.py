from typing import Any, Dict, Optional

from rest_framework.response import Response


def success_response(
    data: Any = None,
    message: Optional[str] = None,
    *,
    status: int = 200,
    **extra_fields: Any,
) -> Response:
    """
    Produce a consistent success payload for frontend consumption.
    `data` may be any JSON-serialisable structure (dict, list, primitive).
    Extra keyword arguments are merged into the root payload (e.g. count, next, previous).
    """
    payload: Dict[str, Any] = {"success": True}
    payload["message"] = message if message is not None else ""
    if data is not None:
        payload["data"] = data
    payload.update(extra_fields)
    return Response(payload, status=status)


def error_response(
    errors: Any,
    message: Optional[str] = None,
    *,
    status: int = 400,
) -> Response:
    """
    Unified error payload. `errors` is expected to be a dict produced by DRF validation
    or a custom structure (lists/strings). Message defaults to "Validation failed."
    """
    payload: Dict[str, Any] = {
        "success": False,
        "message": message if message is not None else "Validation failed.",
        "errors": errors,
    }
    return Response(payload, status=status)


