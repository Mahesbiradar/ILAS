import io
from django.core.files.base import ContentFile

# Ensure dependencies:
# pip install python-barcode pillow

def generate_code128_image_bytes(value: str) -> bytes:
    """
    Generate barcode PNG image as bytes for a given string value.
    Compatible with latest python-barcode version (no add_checksum arg).
    """
    try:
        import barcode
        from barcode.writer import ImageWriter
    except ImportError:
        raise RuntimeError("Missing dependency: pip install python-barcode pillow")

    CODE128 = barcode.get_barcode_class("code128")
    output = io.BytesIO()

    # ✅ Fix: remove add_checksum arg; not required
    code = CODE128(value, writer=ImageWriter())
    code.write(
        output,
        options={
            "module_height": 15.0,
            "font_size": 10,
            "quiet_zone": 2.0,
        },
    )
    output.seek(0)
    return output.getvalue()


def generate_barcode_content_file(value: str, filename=None) -> ContentFile:
    """
    Returns a Django ContentFile suitable for saving to an ImageField.
    """
    data = generate_code128_image_bytes(value)
    filename = filename or f"{value}.png"
    return ContentFile(data, name=filename)
