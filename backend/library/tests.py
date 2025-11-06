# library/tests.py
from django.test import TestCase
from .models import Book, BookCopy


class BookCopyModelTests(TestCase):
    """Tests for Book and BookCopy model behavior (no barcode dependency)."""

    def setUp(self):
        self.book = Book.objects.create(
            title="Test Driven Development",
            author="Kent Beck",
            isbn="9780321146533",
            quantity=2,
        )

    def test_book_creation_and_copy_generation(self):
        """Ensure a book is created correctly and copies are generated."""
        copies = self.book.create_copies(2)
        self.assertEqual(len(copies), 2)
        self.assertTrue(all(c.book == self.book for c in copies))
        self.assertEqual(self.book.quantity, 2)

    def test_copy_code_auto_generation(self):
        """Ensure each BookCopy receives a unique copy_code."""
        copy = self.book.create_copies(1)[0]
        self.assertTrue(copy.copy_code.startswith(self.book.book_code))
        self.assertIn("-", copy.copy_code)
        print(f"[TEST] Generated copy code: {copy.copy_code}")

    def test_quantity_sync_on_delete(self):
        """Ensure deleting a copy updates book.quantity."""
        copies = self.book.create_copies(2)
        copies[0].delete_with_assets()
        self.book.refresh_from_db()
        self.assertEqual(self.book.quantity, 1)
