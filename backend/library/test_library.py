# tests/test_library.py

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.conf import settings

from library.models import Book, BookTransaction, AuditLog, create_audit
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class LibraryModelTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(username="admin", email="admin@example.com", password="pass")
        self.admin.is_staff = True
        self.admin.save()
        self.user = User.objects.create_user(username="user1", email="u1@example.com", password="pass")
        self.book = Book.objects.create(title="Test Book", isbn="ISBN1")

    def test_issue_and_return_creates_transactions_and_audit(self):
        # Issue
        txn = self.book.mark_issued(member=self.user, actor=self.admin, remarks="issue test")
        self.assertTrue(isinstance(txn, BookTransaction))
        self.assertEqual(txn.txn_type, BookTransaction.TYPE_ISSUE)
        self.assertEqual(self.book.status, Book.STATUS_ISSUED)

        # Audit should have an issue entry
        issue_audits = AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_ISSUE)
        self.assertTrue(issue_audits.exists())

        # Return
        ret_txn = self.book.mark_returned(actor=self.admin, remarks="return test")
        self.assertTrue(isinstance(ret_txn, BookTransaction))
        self.assertEqual(ret_txn.txn_type, BookTransaction.TYPE_RETURN)
        self.assertEqual(self.book.status, Book.STATUS_AVAILABLE)

        # return audit present
        return_audits = AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_RETURN)
        self.assertTrue(return_audits.exists())

    def test_prevent_delete_with_active_issue(self):
        txn = self.book.mark_issued(member=self.user, actor=self.admin)
        with self.assertRaises(Exception):
            # pre_delete should prevent deletion when active issue exists
            self.book.delete()

    @override_settings(LIBRARY_MAX_ACTIVE_LOANS=1)
    def test_borrowing_limit_enforced(self):
        # First book issued
        txn = self.book.mark_issued(member=self.user, actor=self.admin)
        # create second book and attempt issue
        b2 = Book.objects.create(title="Book 2", isbn="ISBN2")
        with self.assertRaises(ValueError) as ctx:
            b2.mark_issued(member=self.user, actor=self.admin)
        self.assertIn("max active loans", str(ctx.exception).lower())

    def test_admin_style_save_does_not_duplicate_audit(self):
        # Simulate admin save with suppression then manual audit
        b = Book(title="Admin Book", isbn="ADM001")
        b._suppress_audit = True
        b.last_modified_by = self.admin
        b.save()
        # Admin creates manual audit once
        create_audit(self.admin, AuditLog.ACTION_BOOK_ADD, "Book", b.book_code, new_values={"title": b.title})
        # Only one audit should exist for this add
        audits = AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_ADD, target_id=b.book_code)
        self.assertEqual(audits.count(), 1)
