import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getBookDetails } from "../../api/libraryApi";
import { downloadBarcodeReport } from "../../api/libraryApi";

export default function ViewBarcodes({ bookId, onClose }) {
  const [copies, setCopies] = useState([]);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookId) fetchBarcodes();
    // eslint-disable-next-line
  }, [bookId]);

  const fetchBarcodes = async () => {
    try {
      setLoading(true);
      const book = await getBookDetails(bookId);
      setBookTitle(book.title || "Unknown");
      setCopies(book.copies || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load barcodes.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await downloadBarcodeReport(`book_id=${bookId}`);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle}_barcodes.pdf`;
      a.click();
      toast.success("📥 Barcode PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate barcode PDF.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-6 overflow-y-auto max-h-[90vh] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-lg"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold text-blue-700 mb-4 text-center">
          📚 Barcodes for "{bookTitle}"
        </h2>

        <div className="flex justify-end gap-3 mb-5">
          <button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
          >
            ⬇️ Download PDF
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
          >
            🖨️ Print
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading barcodes...</p>
        ) : copies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
            {copies.map((copy) => (
              <div
                key={copy.copy_id}
                className="border border-gray-200 rounded-lg shadow-sm p-3 flex flex-col items-center text-center hover:shadow-md transition print:border-none print:shadow-none"
              >
                <img
                  src={copy.barcode_image}
                  alt={copy.copy_id}
                  className="w-40 h-20 object-contain mb-2"
                />
                <p className="text-sm font-semibold text-gray-800">
                  {copy.copy_id}
                </p>
                <p className="text-xs text-gray-500">{copy.status}</p>
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
