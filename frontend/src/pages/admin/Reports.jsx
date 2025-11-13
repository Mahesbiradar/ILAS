// src/pages/admin/Reports.jsx
import React, { useState } from "react";
import BookReportDownload from "../../components/admin/reports/BookReportDownload";
import BarcodeReportDownload from "../../components/admin/reports/BarcodeReportDownload";
import ReportFilter from "../../components/admin/reports/ReportFilter";

/**
 * Reports Page
 * Consolidated reports page for library statistics and downloads
 */
export default function Reports() {
  const [filters, setFilters] = useState({
    category: "",
    status: "",
  });

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center">
        📊 Library Reports
      </h1>

      {/* Filters */}
      <div className="mb-6">
        <ReportFilter filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Book Master Report */}
        <BookReportDownload filters={filters} />

        {/* Barcode Sheet */}
        <BarcodeReportDownload filters={filters} />

        {/* Transaction Report */}
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            📋 Transaction Report
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Detailed log of all issue/return transactions.
          </p>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg w-full">
            Download CSV
          </button>
        </div>

        {/* Inventory Report */}
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            📦 Inventory Report
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Current stock status and book availability.
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg w-full">
            Download CSV
          </button>
        </div>

        {/* Overdue Report */}
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            ⏰ Overdue Books
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Books overdue for return with member details.
          </p>
          <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg w-full">
            Download CSV
          </button>
        </div>

        {/* Member History Report */}
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            👤 Member History
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Borrowing history for individual members.
          </p>
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded-lg w-full">
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
