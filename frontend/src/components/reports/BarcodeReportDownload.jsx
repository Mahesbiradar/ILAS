// src/components/reports/BarcodeReportDownload.jsx
import React from "react";
import { downloadBarcodeReport } from "../../api/libraryApi";
import toast from "react-hot-toast";

export default function BarcodeReportDownload({ filters }) {
  const handleDownload = async () => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await downloadBarcodeReport(query);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "barcodes.pdf";
      a.click();
      toast.success("🖨️ Barcode PDF downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download barcode sheet.");
    }
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        🖨️ Barcode Sheet
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Printable barcode sheet (A4 format, 24 labels per page).
      </p>
      <button
        onClick={handleDownload}
        className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg w-full"
      >
        Download PDF
      </button>
    </div>
  );
}
