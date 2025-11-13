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
        r = self.client.post("/transactions/issue/", data, format="json")
        self.assertEqual(r.status_code, 400)

    def test_api_same_member_must_return(self):
        # Issue
        self.book.mark_issued(member=self.member, actor=self.admin)
        other = User.objects.create_user(username="x", email="x@test.com", password="p")
        data = {"book_id": self.book.id, "member_id": other.id}
        r = self.client.post("/transactions/return/", data, format="json")
        self.assertEqual(r.status_code, 403)

    def test_api_prevents_manual_status_change_of_issued_book(self):
        self.book.mark_issued(member=self.member, actor=self.admin)
        data = {"book_id": self.book.id, "status": "AVAILABLE"}
        r = self.client.post("/transactions/status/", data, format="json")
        self.assertEqual(r.status_code, 400)
