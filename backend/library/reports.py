# library/reports.py
import csv
import io
from datetime import datetime

from django.http import HttpResponse, FileResponse
from django.utils import timezone
from django.db.models import Count, Sum, Q
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

from .models import Book, BookCopy, AuditLog


# ======================================================================
# 🔹 CSV Report Utilities
# ======================================================================
def _csv_response(filename, headers, rows):
    """Helper for CSV response creation."""
    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(headers)
    writer.writerows(rows)
    return response


# ======================================================================
# 📚 BOOKS REPORTS
# ======================================================================
def books_report_csv(request):
    """Export all books in CSV format."""
    books = Book.objects.all().order_by("title")

    headers = [
        "Book Code", "Title", "Author", "ISBN", "Category", "Quantity",
        "Cost", "Vendor", "Shelf", "Added Date"
    ]

    rows = [
        [
            b.book_code, b.title, b.author or "", b.isbn or "",
            b.category or "", b.quantity,
            str(b.book_cost or ""), b.vendor_name or "",
            b.shelf_location or "",
            timezone.localtime(b.added_date).strftime("%Y-%m-%d %H:%M"),
        ]
        for b in books
    ]

    return _csv_response("books_report.csv", headers, rows)


def books_report_pdf(request):
    """Generate a simple PDF report of all books (summary view)."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin_x, margin_y = 20 * mm, 20 * mm

    books = Book.objects.all().order_by("title")
    y = height - margin_y
    p.setFont("Helvetica-Bold", 16)
    p.drawString(margin_x, y, "Library Books Report")
    y -= 20
    p.setFont("Helvetica", 11)
    p.drawString(margin_x, y, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 30

    p.setFont("Helvetica-Bold", 12)
    p.drawString(margin_x, y, "Book Code")
    p.drawString(margin_x + 100, y, "Title")
    p.drawString(margin_x + 300, y, "Qty")
    y -= 15
    p.line(margin_x, y, width - margin_x, y)
    y -= 10

    p.setFont("Helvetica", 10)
    for b in books:
        if y < 60:
            p.showPage()
            y = height - margin_y
            p.setFont("Helvetica-Bold", 12)
            p.drawString(margin_x, y, "Book Code")
            p.drawString(margin_x + 100, y, "Title")
            p.drawString(margin_x + 300, y, "Qty")
            y -= 25
            p.setFont("Helvetica", 10)

        p.drawString(margin_x, y, b.book_code)
        p.drawString(margin_x + 100, y, b.title[:40])
        p.drawString(margin_x + 300, y, str(b.quantity))
        y -= 15

    p.save()
    buffer.seek(0)
    return FileResponse(buffer, as_attachment=True, filename="books_report.pdf")


# ======================================================================
# 📦 BOOK COPIES REPORTS
# ======================================================================
def copies_report_csv(request):
    """Export all book copies in CSV format."""
    copies = BookCopy.objects.select_related("book").order_by("book__title", "copy_code")

    headers = [
        "Copy Code", "Book Code", "Book Title", "Status", "Shelf", "Condition",
        "Purchase Date", "Created At"
    ]

    rows = [
        [
            c.copy_code, c.book.book_code, c.book.title,
            c.status, c.shelf_location or "", c.condition,
            c.purchase_date or "", timezone.localtime(c.created_at).strftime("%Y-%m-%d"),
        ]
        for c in copies
    ]

    return _csv_response("bookcopies_report.csv", headers, rows)


# ======================================================================
# 🧾 AUDIT LOG REPORTS
# ======================================================================
def audit_log_report_csv(request):
    """Export all audit logs in CSV format."""
    logs = AuditLog.objects.select_related("actor").order_by("-created_at")

    headers = ["Timestamp", "Actor", "Action", "Target Type", "Target ID", "Payload"]

    rows = [
        [
            timezone.localtime(l.created_at).strftime("%Y-%m-%d %H:%M"),
            getattr(l.actor, "username", "System") if l.actor else "System",
            l.action,
            l.target_type or "",
            l.target_id or "",
            str(l.payload or {}),
        ]
        for l in logs
    ]

    return _csv_response("audit_logs_report.csv", headers, rows)


# ======================================================================
# 📊 INVENTORY SUMMARY REPORTS
# ======================================================================
def inventory_summary_csv(request):
    """Generate category-wise book counts and total copies."""
    qs = (
        Book.objects.values("category")
        .annotate(
            total_books=Count("id"),
            total_copies=Sum("quantity"),
        )
        .order_by("-total_books")
    )

    headers = ["Category", "Total Books", "Total Copies"]

    rows = [
        [r["category"] or "Uncategorized", r["total_books"], r["total_copies"] or 0]
        for r in qs
    ]

    return _csv_response("inventory_summary.csv", headers, rows)


# ======================================================================
# 📘 REPORT DISPATCH MAP
# ======================================================================
REPORT_MAP = {
    "books_csv": books_report_csv,
    "books_pdf": books_report_pdf,
    "copies_csv": copies_report_csv,
    "audit_csv": audit_log_report_csv,
    "inventory_csv": inventory_summary_csv,
}
