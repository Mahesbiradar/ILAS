// src/components/reports/CopyReportDownload.jsx
import React from "react";
import { downloadCopyReport } from "../../api/libraryApi";
import toast from "react-hot-toast";

export default function CopyReportDownload({ filters }) {
  const handleDownload = async () => {
    try {
      const res = await downloadCopyReport(filters);
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "book_copies_report.csv";
      a.click();
      toast.success("📄 Book Copy Report downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download copy report.");
    }
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        📄 Book Copy Report
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        List of all physical copies with barcodes and statuses.
      </p>
      <button
        onClick={handleDownload}
        className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg w-full"
      >
        Download CSV
      </button>
    </div>
  );
}
