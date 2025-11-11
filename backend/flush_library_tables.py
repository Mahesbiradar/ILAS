#!/usr/bin/env python3
"""
Flush only the Library App data (safe reset)
--------------------------------------------
Deletes all records from:
- BookTransaction
- AuditLog
- Book

Does NOT touch any other apps (like accounts, auth, etc.)
"""

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from library.models import Book, BookTransaction, AuditLog
from django.db import connection

def flush_library_data():
    print("\n⚙️ Flushing Library app data...\n")

    with connection.cursor() as cursor:
        cursor.execute('TRUNCATE TABLE "library_booktransaction" RESTART IDENTITY CASCADE;')
        print("✅ Flushed: BookTransaction")
        cursor.execute('TRUNCATE TABLE "library_auditlog" RESTART IDENTITY CASCADE;')
        print("✅ Flushed: AuditLog")
        cursor.execute('TRUNCATE TABLE "library_book" RESTART IDENTITY CASCADE;')
        print("✅ Flushed: Book")

    print("\n🎉 Library data flushed successfully.\n")

if __name__ == "__main__":
    flush_library_data()
