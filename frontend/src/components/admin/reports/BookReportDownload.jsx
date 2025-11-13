// src/components/admin/reports/BookReportDownload.jsx
import React from "react";
import { downloadBookReport } from "../../../api/libraryApi";
import toast from "react-hot-toast";

export default function BookReportDownload({ filters }) {
  const handleDownload = async () => {
    try {
      const res = await downloadBookReport(filters);
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "book_master_report.csv";
      a.click();
      toast.success("📘 Book Master Report downloaded.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to download report.");
    }
  };

  return (
    <div className="bg-white shadow-lg p-6 rounded-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        📘 Book Master Report
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Complete list of all books with quantities and categories.
      </p>
      <button
        onClick={handleDownload}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg w-full"
      >
        Download CSV
      </button>
    </div>
  );
}
