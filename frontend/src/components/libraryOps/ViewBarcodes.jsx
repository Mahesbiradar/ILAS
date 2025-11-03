// src/components/libraryOps/ViewBarcodes.jsx
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { getBookDetails, downloadBarcodeReport } from "../../api/libraryApi";
import Loader from "../common/Loader";

export default function ViewBarcodes({ bookId, selectedIds = [], onClose }) {
  const [copies, setCopies] = useState([]);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    if (bookId) fetchBarcodes(bookId);
  }, [bookId]);

  const fetchBarcodes = async (id) => {
    try {
      setLoading(true);
      const book = await getBookDetails(id);
      setBookTitle(book.title || "Unknown");
      setCopies(book.copies || []);
    } catch (err) {
      console.error("Barcode fetch error:", err);
      toast.error("Failed to load barcodes.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Download barcode PDF for selected book(s)
  const handleDownloadPDF = async () => {
    try {
      if (!bookId && selectedIds.length === 0)
        return toast.error("No books selected for barcode download!");

      setDownloading(true);
      const query =
        selectedIds.length > 0
          ? selectedIds.map((id) => `book_ids=${id}`).join("&")
          : `book_ids=${bookId}`;

      const res = await downloadBarcodeReport(query);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        selectedIds.length > 1
          ? "Selected_Books_Barcodes.pdf"
          : `${bookTitle}_barcodes.pdf`;
      a.click();
      toast.success("📥 Barcode PDF downloaded!");
    } catch (err) {
      console.error("Barcode download failed:", err);
      toast.error("Failed to generate barcode PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // ✅ Proper barcode image download
  const handleDownloadImage = (copy) => {
    if (!copy.barcode_image) return toast.error("No barcode image available.");

    fetch(copy.barcode_image)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${copy.copy_id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => toast.error("Failed to download image."));
  };

  // ✅ Print only barcode cards (no UI elements)
  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcodes - ${bookTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .barcode-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              page-break-inside: avoid;
            }
            .barcode-card {
              text-align: center;
              border: 1px solid #ccc;
              padding: 10px;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            img {
              width: 200px;
              height: auto;
            }
            p {
              margin: 4px 0;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
            @media print {
              .barcode-card {
                border: none;
                box-shadow: none;
              }
              .download-btn {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">${printContents}</div>
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      {(loading || downloading) && <Loader overlay />}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
          📚 Barcodes for{" "}
          {selectedIds.length > 1
            ? `(${selectedIds.length}) Books`
            : `"${bookTitle}"`}
        </h2>

        {/* Toolbar */}
        <div className="flex justify-end gap-3 mb-5 no-print">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow disabled:opacity-50"
          >
            {downloading ? "Generating..." : "⬇️ Download PDF"}
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            🖨️ Print
          </button>
        </div>

        {/* Barcode Display */}
        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading barcodes...</p>
        ) : copies.length > 0 ? (
          <div
            ref={printRef}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2"
          >
            {copies.map((copy) => (
              <div
                key={copy.copy_id}
                className="barcode-card border border-gray-200 rounded-lg shadow-sm p-3 flex flex-col items-center text-center hover:shadow-md transition"
              >
                <img
                  src={copy.barcode_image}
                  alt={copy.copy_id}
                  className="w-40 h-20 object-contain mb-2"
                />
                <p className="text-sm font-semibold text-gray-800">
                  {copy.copy_id}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  {copy.status || "Available"}
                </p>

                {/* ✅ Hidden from print */}
                <button
                  onClick={() => handleDownloadImage(copy)}
                  className="download-btn text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  ⬇️ Download Image
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-6">
            No barcode copies found for this book.
          </p>
        )}
      </div>
    </div>
  );
}
