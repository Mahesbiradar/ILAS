from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm, inch
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
import barcode
from barcode.writer import ImageWriter
import unicodedata
import re


def sanitize_barcode_value(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_only = re.sub(r"[^\x20-\x7E]", "", ascii_only)
    return ascii_only or "INVALID"


def wrap_text(text, max_width, font_name, font_size):
    words = text.split()
    lines = []
    current = ""

    for word in words:
        test = current + (" " if current else "") + word
        if stringWidth(test, font_name, font_size) <= max_width:
            current = test
        else:
            lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines


def generate_barcode_pdf(raw_text: str, page_size="A4") -> BytesIO:
    buffer = BytesIO()

    # -------- PAGE CONFIG --------
    if page_size == "A3":
        PAGE_WIDTH = 12 * inch
        PAGE_HEIGHT = 18 * inch
        cols = 5
        rows = 18
        margin_x = 20 * mm
        margin_y = 20 * mm
    else:  # A4
        PAGE_WIDTH, PAGE_HEIGHT = A4
        cols = 3
        rows = 12
        margin_x = 15 * mm
        margin_y = 15 * mm

    pdf = canvas.Canvas(buffer, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    cell_width = (PAGE_WIDTH - 2 * margin_x) / cols
    cell_height = (PAGE_HEIGHT - 2 * margin_y) / rows

    x_positions = [margin_x + i * cell_width for i in range(cols)]
    y_positions = [
        PAGE_HEIGHT - margin_y - (j + 1) * cell_height
        for j in range(rows)
    ]

    # ---- Border style (dotted cut guides) ----
    pdf.setLineWidth(0.35)
    pdf.setStrokeColorRGB(0, 0, 0)
    pdf.setDash(2, 2)

    BOTTOM_PADDING = 3  # extra room for 2-line titles

    # ---- Draw GRID ONCE (prevents double borders) ----
    # Vertical lines
    for c in range(cols + 1):
        x_line = margin_x + c * cell_width
        pdf.line(
            x_line,
            margin_y - BOTTOM_PADDING,
            x_line,
            PAGE_HEIGHT - margin_y,
        )

    # Horizontal lines
    for r in range(rows + 1):
        y_line = PAGE_HEIGHT - margin_y - r * cell_height
        pdf.line(
            margin_x,
            y_line - BOTTOM_PADDING,
            PAGE_WIDTH - margin_x,
            y_line - BOTTOM_PADDING,
        )

    code128 = barcode.get_barcode_class("code128")
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    index = 0

    for line in lines:
        parts = line.split(maxsplit=1)
        book_id = parts[0]
        title = parts[1] if len(parts) > 1 else ""

        # ---- New page ----
        if index > 0 and index % (cols * rows) == 0:
            pdf.showPage()

            pdf.setLineWidth(0.35)
            pdf.setStrokeColorRGB(0, 0, 0)
            pdf.setDash(2, 2)

            # redraw grid on new page
            for c in range(cols + 1):
                x_line = margin_x + c * cell_width
                pdf.line(
                    x_line,
                    margin_y - BOTTOM_PADDING,
                    x_line,
                    PAGE_HEIGHT - margin_y,
                )

            for r in range(rows + 1):
                y_line = PAGE_HEIGHT - margin_y - r * cell_height
                pdf.line(
                    margin_x,
                    y_line - BOTTOM_PADDING,
                    PAGE_WIDTH - margin_x,
                    y_line - BOTTOM_PADDING,
                )

        col = index % cols
        row = (index // cols) % rows
        x = x_positions[col]
        y = y_positions[row]

        # ---- Barcode ----
        safe_code = sanitize_barcode_value(book_id)
        barcode_buffer = BytesIO()
        barcode_obj = code128(safe_code, writer=ImageWriter())
        barcode_obj.write(
            barcode_buffer,
            options={
                "module_width": 0.38,
                "module_height": 10,
                "quiet_zone": 1,
                "write_text": False,
            },
        )
        barcode_buffer.seek(0)
        image = ImageReader(barcode_buffer)

        barcode_height = cell_height * 0.52

        pdf.drawImage(
            image,
            x + 6,
            y + cell_height - barcode_height - 6,
            width=cell_width - 12,
            height=barcode_height,
            preserveAspectRatio=True,
            mask="auto",
        )

        # ---- Book ID ----
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawCentredString(
            x + cell_width / 2,
            y + cell_height - barcode_height - 12,
            book_id,
        )

        # ---- Title ----
        pdf.setFont("Helvetica", 7)
        title_lines = wrap_text(title, cell_width - 10, "Helvetica", 7)
        text_y = y + cell_height - barcode_height - 20

        for t in title_lines[:2]:
            pdf.drawCentredString(
                x + cell_width / 2,
                text_y,
                t,
            )
            text_y -= 9

        index += 1

    pdf.save()
    buffer.seek(0)
    return buffer
