# library/tests/test_api_endpoints.py
"""
Comprehensive API integration tests for ILAS Library Management System.

Covers:
 - Book CRUD and permissions
 - Transaction APIs (issue / return / status)
 - Bulk upload via Excel
 - Report CSV generation
 - Admin AJAX endpoints
"""

import tempfile
from openpyxl import Workbook
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from library.models import Book, BookTransaction, AuditLog

User = get_user_model()


class LibraryAPITests(APITestCase):
    def setUp(self):
        """Create sample users, a book, and authenticate admin."""
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username="admin", password="pass", email="a@x.com", is_staff=True
        )
        self.user = User.objects.create_user(
            username="user", password="pass", email="u@x.com"
        )
        self.book = Book.objects.create(title="API Test Book", isbn="B001")

        # Authenticate as admin for all API requests
        self.client.force_authenticate(user=self.admin)

    # --------------------------------------------------------------
    # BOOK CRUD & PERMISSIONS
    # --------------------------------------------------------------
    def test_book_crud_and_permissions(self):
        """Admin can create book; normal user cannot."""
        # List existing books
        resp = self.client.get("/books/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("API Test Book", str(resp.content))

        # Admin creates a book (multipart form to support ImageField)
        data = {"title": "New Book", "isbn": "N001", "language": "EN"}
        resp = self.client.post("/books/", data, format="multipart")
        self.assertEqual(resp.status_code, 201)
        self.assertTrue(Book.objects.filter(isbn="N001").exists())

        # Switch to non-admin user
        self.client.force_authenticate(user=self.user)
        resp = self.client.post("/books/", {"title": "Blocked", "isbn": "B999"}, format="multipart")
        self.assertEqual(resp.status_code, 403)

        # Restore admin
        self.client.force_authenticate(user=self.admin)

    # --------------------------------------------------------------
    # TRANSACTION FLOW
    # --------------------------------------------------------------
    def test_issue_return_status_via_api(self):
        """Verify full transaction workflow through API endpoints."""
        # Issue
        issue_data = {"book_id": self.book.id, "member_id": self.user.id}
        r = self.client.post("/transactions/issue/", issue_data, format="json")
        self.assertEqual(r.status_code, 201)
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, Book.STATUS_ISSUED)
        self.assertTrue(BookTransaction.objects.filter(book=self.book, txn_type="ISSUE").exists())

        # Return (200 OK is expected here)
        r2 = self.client.post("/transactions/return/", {"book_id": self.book.id}, format="json")
        self.assertIn(r2.status_code, [200, 201])
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, Book.STATUS_AVAILABLE)

        # Mark Lost
        r3 = self.client.post("/transactions/status/", {"book_id": self.book.id, "status": "LOST"}, format="json")
        self.assertIn(r3.status_code, [200, 201])
        self.book.refresh_from_db()
        self.assertEqual(self.book.status, Book.STATUS_LOST)

        # Audit logs for all three actions should exist
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_ISSUE).exists())
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_RETURN).exists())
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ACTION_STATUS_CHANGE).exists())

    # --------------------------------------------------------------
    # BULK UPLOAD
    # --------------------------------------------------------------
    def test_bulk_upload_excel(self):
        """Upload Excel sheet to bulk-create books."""
        wb = Workbook()
        ws = wb.active
        ws.append(["title", "isbn", "language"])
        ws.append(["Excel Book", "E001", "EN"])

        # Safe for Windows (avoid locked temp files)
        tmp_path = tempfile.mktemp(suffix=".xlsx")
        wb.save(tmp_path)

        with open(tmp_path, "rb") as f:
            excel_file = SimpleUploadedFile(
                "books.xlsx",
                f.read(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )

        r = self.client.post("/books/bulk-upload/", {"file": excel_file})
        self.assertIn(r.status_code, [200, 302, 201])
        self.assertTrue(Book.objects.filter(isbn="E001").exists())

    # --------------------------------------------------------------
    # REPORTS
    # --------------------------------------------------------------
    def test_reports_csv_generation(self):
        """Generate all CSV reports and verify structure."""
        # Ensure there’s one transaction for data
        self.book.mark_issued(member=self.user, actor=self.admin)

        endpoints = [
            "/reports/master/",
            "/reports/transactions/",
            "/reports/inventory/",
        ]
        for ep in endpoints:
            r = self.client.get(ep)
            self.assertEqual(r.status_code, 200)
            self.assertTrue(r["Content-Type"].startswith("text/csv"))
            content = r.content.decode("utf-8")

            # Inventory report has status,count; others have book_code
            if "inventory" in ep:
                self.assertIn("status", content)
                self.assertIn("count", content)
            else:
                self.assertIn("book_code", content)

    # --------------------------------------------------------------
    # ADMIN AJAX
    # --------------------------------------------------------------
    def test_admin_ajax_searches(self):
        """Admin AJAX endpoints respond with HTML or redirect."""
        # Book search
        rb = self.client.get("/admin/book-search/?q=API")
        self.assertIn(rb.status_code, [200, 302])

        # User search
        ru = self.client.get("/admin/user-search/?q=user")
        self.assertIn(ru.status_code, [200, 302])

        # Active transactions
        self.book.mark_issued(member=self.user, actor=self.admin)
        rt = self.client.get("/admin/active-transactions/")
        self.assertIn(rt.status_code, [200, 302])
