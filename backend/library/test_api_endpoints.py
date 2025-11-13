# tests/test_api_rules.py
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from library.models import Book, BookTransaction

User = get_user_model()


class LibraryAPIBusinessRuleTests(APITestCase):
    """Ensures API endpoints enforce the same R1–R8 rules as models."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin", email="admin@a.com", password="pass", is_staff=True
        )
        self.member = User.objects.create_user(
            username="member", email="member@a.com", password="pass"
        )
        self.client.force_authenticate(self.admin)
        self.book = Book.objects.create(title="API Rule", author="Auth", isbn="B01", category="Tech", shelf_location="S1")

    def test_api_issue_unavailable_book_fails(self):
        self.book.status = Book.STATUS_LOST
        self.book.save()
        data = {"book_id": self.book.id, "member_id": self.member.id}
        r = self.client.post("/api/v1/admin/transactions/issue/", data, format="json")
        self.assertEqual(r.status_code, 400)

    def test_api_same_member_must_return(self):
        # Issue
        self.book.mark_issued(member=self.member, actor=self.admin)
        other = User.objects.create_user(username="x", email="x@test.com", password="p")
        data = {"book_id": self.book.id, "member_id": other.id}
        r = self.client.post("/api/v1/admin/transactions/return/", data, format="json")
        self.assertEqual(r.status_code, 403)

    def test_api_prevents_manual_status_change_of_issued_book(self):
        self.book.mark_issued(member=self.member, actor=self.admin)
        data = {"book_id": self.book.id, "status": "AVAILABLE"}
        r = self.client.post("/api/v1/admin/transactions/status/", data, format="json")
        self.assertEqual(r.status_code, 400)

    def test_api_allows_reactivating_book_to_available(self):
        self.book.mark_status("MAINTENANCE", actor=self.admin)
        data = {"book_id": self.book.id, "status": "AVAILABLE"}
        response = self.client.post("/api/v1/admin/transactions/status/", data, format="json")
        self.assertEqual(response.status_code, 200)
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, Book.STATUS_AVAILABLE)

    def test_public_books_action_returns_paginated_payload(self):
        for idx in range(25):
            Book.objects.create(
                title=f"Book {idx}",
                author="Auth",
                isbn=f"PB{idx:03d}",
                category="Tech",
                shelf_location="S1",
            )
        response = self.client.get("/api/v1/library/books/public/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertTrue(response.data["count"] >= 1)

    def test_public_books_endpoint_returns_paginated_payload(self):
        response = self.client.get("/api/v1/public/books/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)

    def test_active_transactions_endpoint_paginated(self):
        books = [
            Book.objects.create(
                title=f"Issue {idx}",
                author="Auth",
                isbn=f"AT{idx:03d}",
                category="Tech",
                shelf_location="S1",
            )
            for idx in range(3)
        ]
        for bk in books:
            bk.mark_issued(member=self.member, actor=self.admin)
        response = self.client.get("/api/v1/admin/transactions/active/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertGreaterEqual(response.data["count"], 3)

    def test_admin_ajax_search_endpoints_paginated(self):
        response = self.client.get("/api/v1/admin/ajax/book-search/", {"q": "API"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)

        response = self.client.get("/api/v1/admin/ajax/user-search/", {"q": "admin"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)