from django.core.management.base import BaseCommand
from django.db import connection
from library.models import Book, BookCopy, Transaction, AuditLog
import os
import shutil

class Command(BaseCommand):
    help = "Completely resets ILAS database — deletes all books, copies, transactions, logs, and media files."

    def handle(self, *args, **options):
        self.stdout.write("🚀 Resetting ILAS database and media directories...")

        # Delete all objects
        Transaction.objects.all().delete()
        AuditLog.objects.all().delete()
        BookCopy.objects.all().delete()
        Book.objects.all().delete()

        # Reset ID sequences
        with connection.cursor() as cursor:
            vendor = connection.vendor
            tables = [
                "library_book",
                "library_bookcopy",
                "library_transaction",
                "library_auditlog"
            ]
            for table in tables:
                try:
                    if vendor == "postgresql":
                        seq_name = f"{table}_id_seq"
                        cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1;")
                    elif vendor == "sqlite":
                        cursor.execute("DELETE FROM sqlite_sequence WHERE name=%s;", [table])
                    self.stdout.write(self.style.SUCCESS(f"✅ Reset sequence for {table}"))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"⚠️ Skipped {table}: {e}"))

        # Delete barcode and book cover media
        base_media = os.path.join(os.getcwd(), "media")
        barcode_path = os.path.join(base_media, "barcodes")
        cover_path = os.path.join(base_media, "book_covers")

        for path in [barcode_path, cover_path]:
            if os.path.exists(path):
                shutil.rmtree(path)
                os.makedirs(path, exist_ok=True)
                self.stdout.write(self.style.SUCCESS(f"🧹 Cleaned {path}"))

        self.stdout.write(self.style.SUCCESS("✅ ILAS reset complete! All data, logs, and media cleared."))
