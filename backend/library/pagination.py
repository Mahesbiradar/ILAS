from typing import Optional

from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Default pagination for ILAS APIs.
    - Page size 20 (matches REST_FRAMEWORK settings)
    - Clients can request a custom page size up to 100 via ?page_size=
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminResultsSetPagination(StandardResultsSetPagination):
    """
    Larger window for admin dashboards/searches.
    - Default size 50
    - Accepts legacy ?limit= param as alias to page_size
    - Allows page_size override up to 200
    """

    page_size = 50
    max_page_size = 200

    def get_page_size(self, request) -> Optional[int]:
        limit = request.query_params.get("limit")
        if limit:
            try:
                limit_value = int(limit)
                if limit_value > 0:
                    return min(limit_value, self.max_page_size)
            except (TypeError, ValueError):
                pass
        return super().get_page_size(request)


