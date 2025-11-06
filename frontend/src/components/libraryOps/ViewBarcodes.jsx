// src/components/libraryOps/ViewBarcodes.jsx
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  getBookCopies,
  downloadCopyBarcode,
  downloadSelectedCopyBarcodesZIP,
  downloadSingleBookBarcode,
  downloadSelectedBarcodesPDF,
  downloadAllBarcodesPDF,
} from "../../api/libraryApi";
import Loader from "../common/Loader";

export default function ViewBarcodes({ bookCode, selectedCodes = [], onClose }) {
  const [copies, setCopies] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef();

  // 🔹 Fetch all copies for this book
  useEffect(() => {
    if (!bookCode) return;
    (async () => {
      try {
        const res = await getBookCopies(bookCode);
        setCopies(res);
      } catch (err) {
        console.error("Error fetching copies:", err);
        toast.error("Failed to load book copies.");
      }
    })();
  }, [bookCode]);

  // 🔹 Download single book-level barcode (legacy)
  const handleDownloadSingleBook = async () => {
    if (!bookCode) return toast.error("Book code missing!");
    try {
      setDownloading(true);
      const res = await downloadSingleBookBarcode(bookCode);
      const blob = new Blob([res.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookCode}.png`;
      a.click();
      toast.success("📘 Book barcode downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download book barcode.");
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Download a single copy barcode
  const handleDownloadCopy = async (copyCode) => {
    try {
      setDownloading(true);
      const res = await downloadCopyBarcode(copyCode);
      const blob = new Blob([res.data], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${copyCode}.png`;
      a.click();
      toast.success(`📥 Barcode for ${copyCode} downloaded!`);
    } catch (err) {
      console.error("Copy barcode error:", err);
      toast.error("Failed to download copy barcode.");
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Download all copy barcodes (ZIP)
  const handleDownloadAllCopies = async () => {
    try {
      if (!copies.length) return toast.error("No copies found!");
      setDownloading(true);
      const ids = copies.map((c) => c.id);
      const res = await downloadSelectedCopyBarcodesZIP(ids);
      const blob = new Blob([res.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookCode}_barcodes.zip`;
      a.click();
      toast.success("📦 All copy barcodes downloaded (ZIP)!");
    } catch (err) {
      console.error("Download all copies error:", err);
      toast.error("Failed to download all copy barcodes.");
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Download selected books (PDF)
  const handleDownloadSelectedBooks = async () => {
    if (!selectedCodes.length)
      return toast.error("Select at least one book!");
    try {
      setDownloading(true);
      const res = await downloadSelectedBarcodesPDF(selectedCodes);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SelectedBooks_Barcodes.pdf";
      a.click();
      toast.success("📥 Selected books' barcodes downloaded!");
    } catch (err) {
      console.error("Selected book barcode error:", err);
      toast.error("Failed to download selected book barcodes.");
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Download all books (PDF)
  const handleDownloadAllBooks = async () => {
    try {
      setDownloading(true);
      const res = await downloadAllBarcodesPDF();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "AllBooks_Barcodes.pdf";
      a.click();
      toast.success("🌐 All book barcodes downloaded!");
    } catch (err) {
      console.error("All book barcode error:", err);
      toast.error("Failed to download all barcodes.");
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Print View
  const handlePrint = () => {
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Book Barcodes</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .card { border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center; }
            img { width: 180px; height: auto; }
            p { margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="grid">${printContent}</div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      {downloading && <Loader overlay />}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 overflow-y-auto max-h-[90vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
          🏷️ Barcode Management — {bookCode || "All Books"}
        </h2>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-center gap-3 mb-5">
          {bookCode && (
            <>
              <button
                onClick={handleDownloadSingleBook}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                📘 Book Barcode
              </button>
              <button
                onClick={handleDownloadAllCopies}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                📦 All Copies (ZIP)
              </button>
            </>
          )}
          {!bookCode && (
            <>
              <button
                onClick={handleDownloadSelectedBooks}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
              >
                📚 Selected Books (PDF)
              </button>
              <button
                onClick={handleDownloadAllBooks}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                🌐 All Books (PDF)
              </button>
            </>
          )}
          <button
            onClick={handlePrint}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            🖨️ Print
          </button>
        </div>

        {/* Barcode Preview Grid */}
        <div
          ref={printRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4"
        >
          {copies.length > 0 ? (
            copies.map((copy) => (
              <div
                key={copy.copy_code}
                className="border rounded-lg p-3 shadow-sm flex flex-col items-center hover:shadow-md transition"
              >
                <img
                  src={`/media/${copy.barcode_png || `barcodes/${bookCode}/${copy.copy_code}.png`}`}
                  alt={copy.copy_code}
                  className="w-40 h-20 object-contain mb-2"
                />
                <p className="font-semibold text-gray-800">{copy.copy_code}</p>
                <p className="text-xs text-gray-500">
                  Status: {copy.status || "Available"}
                </p>
                <button
                  onClick={() => handleDownloadCopy(copy.copy_code)}
                  className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
                >
                  ⬇️ Download
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 col-span-full">
              {bookCode
                ? "No copies found for this book."
                : "Select a book to view barcodes."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
