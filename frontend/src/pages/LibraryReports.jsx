// src/pages/LibraryReports.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import BookReportDownload from "../components/reports/BookReportDownload";
import CopyReportDownload from "../components/reports/CopyReportDownload";
import BarcodeReportDownload from "../components/reports/BarcodeReportDownload";
import ReportFilter from "../components/reports/ReportFilter";

export default function LibraryReports() {
  const [filters, setFilters] = useState({ category: "", status: "" });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        📊 Library Reports & Barcode Sheets
      </h1>

      {/* Filter Section */}
      <ReportFilter filters={filters} onFilterChange={handleFilterChange} />

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Book Master Report */}
        <BookReportDownload filters={filters} />

        {/* Book Copy Report */}
        <CopyReportDownload filters={filters} />

        {/* Barcode PDF Report */}
        <BarcodeReportDownload filters={filters} />
      </div>

      <p className="text-center text-gray-500 text-sm mt-10">
        All reports are generated from the ILAS database in real-time.
      </p>
    </div>
  );
}
