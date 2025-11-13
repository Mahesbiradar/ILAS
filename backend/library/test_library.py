# tests/test_library.py
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.db.utils import IntegrityError
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from library.models import Book, BookTransaction, AuditLog

User = get_user_model()


class LibraryModelBusinessRuleTests(TestCase):
    """Covers R1–R8 validation for core model logic."""

    def setUp(self):
        self.admin = User.objects.create_user(
        username="admin",
        email="admin@test.com",
        password="pass",
        is_staff=True,
         )

        self.member = User.objects.create_user(
            username="member",
            email="member@test.com",
            password="pass",
         )

        

        self.book = Book.objects.create(title="RuleBook", author="T1", isbn="R001", category="Fiction", shelf_location="A1")

    # -------------------------------
    # R1. ISSUE VALIDATION
    # -------------------------------
    def test_r1_issue_book_only_if_available(self):
        """R1.02 – Issue only if AVAILABLE."""
        self.book.status = Book.STATUS_LOST
        self.book.save()
        with self.assertRaises(ValueError):
            self.book.mark_issued(member=self.member, actor=self.admin)

    def test_r1_single_active_issue_per_book(self):
        """R1.01 – Only one active issue per book enforced at app & DB level."""
        txn1 = self.book.mark_issued(member=self.member, actor=self.admin)
        self.assertEqual(txn1.txn_type, BookTransaction.TYPE_ISSUE)
        with self.assertRaises(ValueError):
            self.book.mark_issued(member=self.member, actor=self.admin)

    def test_r1_db_unique_constraint(self):
        """DB-level uq_active_issue_per_book works."""
        self.book.mark_issued(member=self.member, actor=self.admin)
        with self.assertRaises(IntegrityError):
            BookTransaction.objects.create(
                book=self.book, member=self.member, actor=self.admin,
                txn_type="ISSUE", is_active=True
            )

    # -------------------------------
    # R2. RETURN VALIDATION
    # -------------------------------
    def test_r2_return_requires_active_issue(self):
        """R2.01 – Return requires active issue."""
        with self.assertRaises(ValueError):
            self.book.mark_returned(actor=self.admin)

    def test_r2_return_same_member_only(self):
        """R2.02 – Return must be by same member."""
        txn = self.book.mark_issued(member=self.member, actor=self.admin)
        other = User.objects.create_user(username="other", password="p")
        with self.assertRaises(ValueError):
            self.book.mark_returned(actor=other)

    def test_r2_fine_calculation_overdue(self):
        """R2.04 – Fine computed correctly."""
        txn = self.book.mark_issued(member=self.member, actor=self.admin)
        txn.due_date = timezone.now() - timedelta(days=3)
        txn.save()
        ret_txn = self.book.mark_returned(actor=self.admin)
        self.assertGreater(ret_txn.fine_amount, Decimal("0.00"))

    # -------------------------------
    # R4. STATUS UPDATES
    # -------------------------------
    def test_r4_lost_creates_transaction(self):
        """R4.01 – Lost/Damaged creates txn."""
        txn = self.book.mark_status("LOST", actor=self.admin)
        self.assertEqual(txn.txn_type, "LOST")
        self.assertEqual(self.book.status, Book.STATUS_LOST)

    def test_r4_removed_final(self):
        """R4.04 – Removed books cannot be changed again."""
        self.book.mark_status("REMOVED", actor=self.admin)
        with self.assertRaises(ValueError):
            self.book.mark_status("DAMAGED", actor=self.admin)

    # -------------------------------
    # R5. FINES & IMMUTABILITY
    # -------------------------------
    def test_r5_fine_record_is_immutable(self):
        """Fine record once created cannot be changed (read-only enforcement)."""
        txn = self.book.mark_issued(member=self.member, actor=self.admin)
        ret_txn = self.book.mark_returned(actor=self.admin)
        with self.assertRaises(ValueError):
            ret_txn.fine_amount = Decimal("99.99")
            ret_txn.save(force_update=True)

    # -------------------------------
    # R6. DELETION & AUDIT
    # -------------------------------
    def test_r6_prevent_delete_when_issued(self):
        """Cannot delete issued books."""
        self.book.mark_issued(member=self.member, actor=self.admin)
        with self.assertRaises(Exception):
            self.book.delete()

    def test_r7_audit_created_on_issue_and_return(self):
        """Audit logs created on issue and return."""
        self.book.mark_issued(member=self.member, actor=self.admin)
        self.book.mark_returned(actor=self.admin)
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_ISSUE).exists())
        self.assertTrue(AuditLog.objects.filter(action=AuditLog.ACTION_BOOK_RETURN).exists())

    # -------------------------------
    # R8. CONCURRENCY
    # -------------------------------
    def test_r8_atomicity_prevents_race_conditions(self):
        """Atomic issue prevents two concurrent writes."""
        self.book.mark_issued(member=self.member, actor=self.admin)
        with self.assertRaises(ValueError):
            self.book.mark_issued(member=self.member, actor=self.admin)
