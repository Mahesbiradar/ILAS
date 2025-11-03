# library/tasks.py
from celery import shared_task
from django.conf import settings
from django.core.files.base import ContentFile
from io import BytesIO
import os
import traceback

# Optional heavy libs imported at runtime to avoid startup failure
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
except Exception:
    A4 = None

try:
    from PIL import Image
except Exception:
    Image = None


@shared_task(bind=True)
def debug_task(self):
    print("[DEBUG TASK] Celery debug task executed. Request:", getattr(self, "request", None))
    return "ok"


# --------------------------------------------------------------------------
# 📦 BULK BARCODE GENERATION
# --------------------------------------------------------------------------
@shared_task(bind=True)
def generate_bulk_barcodes(self, book_ids=None, regenerate=False):
    """Generate barcode images for all copies of given book ids (or all books if None)."""
    try:
        from .models import Book, BookCopy, _generate_barcode_content_file
    except Exception as e:
        print("Import error in task generate_bulk_barcodes:", e)
        return {"error": str(e)}

    created = 0
    processed_copy_ids = []

    qs = Book.objects.all()
    if book_ids:
        id_list = [b for b in book_ids if isinstance(b, int) or (isinstance(b, str) and b.isdigit())]
        code_list = [b for b in book_ids if isinstance(b, str) and not b.isdigit()]
        if id_list:
            qs = qs.filter(id__in=[int(x) for x in id_list])
        if code_list:
            qs = qs | Book.objects.filter(book_code__in=code_list)
        qs = qs.distinct()

    copies = BookCopy.objects.filter(book__in=qs).select_related("book")

    for copy in copies:
        try:
            if copy.barcode_image and not regenerate:
                processed_copy_ids.append(copy.copy_id)
                continue

            content = _generate_barcode_content_file(copy.barcode_value, copy.book.title)
            if content and getattr(content, "size", None) and content.size > 0:
                filename = f"{copy.copy_id}.png"
                try:
                    if Image is not None:
                        img = Image.open(BytesIO(content.read()))
                        out_buf = BytesIO()
                        img.save(out_buf, format="PNG", optimize=True)
                        out_buf.seek(0)
                        copy.barcode_image.save(filename, ContentFile(out_buf.read()), save=True)
                    else:
                        copy.barcode_image.save(filename, content, save=True)
                except Exception:
                    content.seek(0)
                    copy.barcode_image.save(filename, content, save=True)
                created += 1
                processed_copy_ids.append(copy.copy_id)
        except Exception as e:
            print("Error generating barcode for", copy.copy_id, e, traceback.format_exc())

    if processed_copy_ids:
        pdf_task = generate_barcode_pdf.delay(processed_copy_ids)
        return {"generated": created, "copies": processed_copy_ids, "pdf_task_id": pdf_task.id}
    return {"generated": created, "copies": processed_copy_ids}


# --------------------------------------------------------------------------
# 🧾 SINGLE COPY BARCODE GENERATION
# --------------------------------------------------------------------------
@shared_task(bind=True)
def generate_barcode_for_copy(self, copy_id, regenerate=False):
    """
    Generate and save barcode image for a single BookCopy.
    Works safely as a Celery background task.
    """
    try:
        from .models import BookCopy
        from barcode import Code128
        from barcode.writer import ImageWriter
    except Exception as e:
        print("[generate_barcode_for_copy] import error:", e)
        return {"error": str(e)}

    try:
        copy = BookCopy.objects.select_related("book").get(id=copy_id)
    except BookCopy.DoesNotExist:
        return {"error": f"BookCopy {copy_id} not found"}

    # Skip if barcode exists and no regeneration requested
    if copy.barcode_image and not regenerate:
        return {"skipped": copy.copy_id}

    try:
        # Create barcode content
        barcode_value = copy.barcode_value or copy.copy_id
        filename = f"{copy.copy_id}.png"

        # Generate barcode as image in memory
        buffer = BytesIO()
        Code128(barcode_value, writer=ImageWriter()).write(
            buffer, {"module_height": 10.0, "font_size": 8, "quiet_zone": 2.0}
        )
        buffer.seek(0)

        # Ensure directory
        barcode_dir = os.path.join(settings.MEDIA_ROOT, "barcodes")
        os.makedirs(barcode_dir, exist_ok=True)

        # Save file
        rel_path = os.path.join("barcodes", filename)
        abs_path = os.path.join(settings.MEDIA_ROOT, rel_path)

        with open(abs_path, "wb") as f:
            f.write(buffer.read())

        # Attach to BookCopy model
        copy.barcode_image.name = rel_path
        copy.save(update_fields=["barcode_image"])

        print(f"[BARCODE] Generated barcode for copy {copy.copy_id}")
        return {"success": copy.copy_id, "file": rel_path}

    except Exception as e:
        print("[generate_barcode_for_copy] error:", e)
        traceback.print_exc()
        return {"error": str(e)}


# --------------------------------------------------------------------------
# 🖨️ BARCODE PDF GENERATION
# --------------------------------------------------------------------------
@shared_task(bind=True)
def generate_barcode_pdf(self, copy_ids=None, output_name=None):
    """Create a printable A4 PDF with barcodes arranged in a 3x5 grid (15 labels per page)."""
    if A4 is None:
        return {"error": "reportlab not installed"}

    try:
        from .models import BookCopy
    except Exception as e:
        return {"error": str(e)}

    if copy_ids:
        copies = BookCopy.objects.filter(copy_id__in=copy_ids).select_related("book")
    else:
        copies = BookCopy.objects.all().select_related("book")

    if not copies.exists():
        return {"error": "no copies found"}

    cols = getattr(settings, "BARCODE_A4_MAX_COLS", 3)
    rows = getattr(settings, "BARCODE_A4_MAX_ROWS", 5)
    label_w = getattr(settings, "BARCODE_LABEL_WIDTH_MM", 60) * mm
    label_h = getattr(settings, "BARCODE_LABEL_HEIGHT_MM", 50) * mm
    margin_l = getattr(settings, "BARCODE_PAGE_MARGIN_LEFT_MM", 12) * mm
    margin_t = getattr(settings, "BARCODE_PAGE_MARGIN_TOP_MM", 20) * mm

    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    page_w, page_h = A4

    col = 0
    row = 0

    for copy in copies:
        try:
            if not copy.barcode_image:
                continue
            img_path = os.path.join(settings.MEDIA_ROOT, str(copy.barcode_image))
            if not os.path.exists(img_path):
                continue

            x = margin_l + col * label_w
            y = page_h - (margin_t + (row + 1) * label_h)

            p.drawImage(
                ImageReader(img_path),
                x, y,
                width=label_w,
                height=label_h,
                preserveAspectRatio=True,
                anchor="nw",
            )

            col += 1
            if col >= cols:
                col = 0
                row += 1
                if row >= rows:
                    p.showPage()
                    row = 0
        except Exception as e:
            print("Error adding copy to PDF:", copy.copy_id, e)

    p.save()
    buffer.seek(0)

    reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    fname = output_name or f"barcodes_batch.pdf"
    out_path = os.path.join(reports_dir, fname)

    with open(out_path, "wb") as f:
        f.write(buffer.read())

    rel_path = os.path.join("reports", fname)
    return {"file": rel_path}


# --------------------------------------------------------------------------
# 🗂️ ARCHIVE & CLEANUP TASKS
# --------------------------------------------------------------------------
from datetime import timedelta
from django.utils import timezone


@shared_task
def archive_old_transactions():
    """Move transactions older than 6 months to TransactionArchive and delete them."""
    try:
        from .models import Transaction, TransactionArchive
    except Exception as e:
        print("Archive task import error:", e)
        return {"error": str(e)}

    six_months_ago = timezone.now() - timedelta(days=180)
    old_txns = Transaction.objects.filter(created_at__lt=six_months_ago)

    count = 0
    for txn in old_txns:
        try:
            TransactionArchive.objects.create(
                user=txn.user,
                book_title=getattr(txn.book_copy.book, "title", "Unknown") if hasattr(txn, "book_copy") else (getattr(txn.book, "title", "Unknown") if getattr(txn, "book", None) else "Unknown"),
                type=txn.type,
                original_id=txn.id,
            )
            txn.delete()
            count += 1
        except Exception as e:
            print("Failed to archive txn", txn.id, e)

    print(f"[ARCHIVE] {count} old transactions moved to archive.")
    return {"archived": count}


@shared_task
def cleanup_orphan_barcodes():
    """Delete barcode images with no matching BookCopy."""
    try:
        from .models import BookCopy
    except Exception as e:
        print("Cleanup import error:", e)
        return {"error": str(e)}

    barcode_dir = os.path.join(settings.MEDIA_ROOT, "barcodes")
    if not os.path.exists(barcode_dir):
        return {"deleted": 0}

    deleted = 0
    for filename in os.listdir(barcode_dir):
        full_path = os.path.join(barcode_dir, filename)
        copy_id = os.path.splitext(filename)[0]

        if not BookCopy.objects.filter(copy_id=copy_id).exists():
            try:
                os.remove(full_path)
                deleted += 1
            except Exception as e:
                print("Failed to delete", full_path, e)

    print(f"[CLEANUP] Deleted {deleted} unused barcodes.")
    return {"deleted": deleted}
