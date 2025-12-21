from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
import barcode
from barcode.writer import ImageWriter


def wrap_text(text, max_width, canvas_obj, font_name, font_size):
    """Wrap text to fit inside max_width"""
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


def generate_barcode_pdf(raw_text: str) -> BytesIO:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)

    page_width, page_height = A4

    # ---- Grid layout ----
    cols = 3
    rows = 12

    margin_x = 15 * mm
    margin_y = 15 * mm

    cell_width = (page_width - 2 * margin_x) / cols
    cell_height = (page_height - 2 * margin_y) / rows

    x_positions = [margin_x + i * cell_width for i in range(cols)]
    y_positions = [
        page_height - margin_y - (j + 1) * cell_height
        for j in range(rows)
    ]

    # ---- Dotted border style for cutting ----
    pdf.setLineWidth(0.35)
    pdf.setStrokeColorRGB(0, 0, 0)
    pdf.setDash(2, 2)  # 🔥 DOTTED LINES

    code128 = barcode.get_barcode_class("code128")

    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    index = 0

    for line in lines:
        parts = line.split(maxsplit=1)
        book_id = parts[0]
        title = parts[1] if len(parts) > 1 else ""

        if index > 0 and index % (cols * rows) == 0:
            pdf.showPage()
            pdf.setLineWidth(0.35)
            pdf.setStrokeColorRGB(0, 0, 0)
            pdf.setDash(2, 2)  # reset dash after new page

        col = index % cols
        row = (index // cols) % rows

        x = x_positions[col]
        y = y_positions[row]

        # ---- Draw DOTTED cell border (CUT GUIDE) ----
        BOTTOM_PADDING = 3  # extra space for 2-line titles

        pdf.rect(
            x,
            y - BOTTOM_PADDING,
            cell_width,
            cell_height,
            stroke=1,
            fill=0,
        )

        # ---- Generate barcode image (NO text inside barcode) ----
        barcode_buffer = BytesIO()
        barcode_obj = code128(book_id, writer=ImageWriter())
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

        # ---- Draw Book ID ----
        pdf.setFont("Helvetica-Bold", 8)
        pdf.drawCentredString(
            x + cell_width / 2,
            y + cell_height - barcode_height - 12,
            book_id,
        )

        # ---- Draw wrapped title ----
        pdf.setFont("Helvetica", 7)
        title_lines = wrap_text(
            title,
            cell_width - 10,
            pdf,
            "Helvetica",
            7,
        )

        text_y = y + cell_height - barcode_height - 20
        for line in title_lines[:2]:
            pdf.drawCentredString(
                x + cell_width / 2,
                text_y,
                line,
            )
            text_y -= 9

        index += 1

    pdf.save()
    buffer.seek(0)
    return buffer
