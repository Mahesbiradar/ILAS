// src/components/reports/ReportFilter.jsx
import React from "react";

export default function ReportFilter({ filters, onFilterChange }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-4 flex flex-wrap gap-4 justify-between">
      <input
        type="text"
        placeholder="Filter by Category"
        value={filters.category}
        onChange={(e) => onFilterChange("category", e.target.value)}
        className="border rounded-lg px-3 py-2 w-full sm:w-1/3"
      />

      <select
        value={filters.status}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className="border rounded-lg px-3 py-2 w-full sm:w-1/3"
      >
        <option value="">All Status</option>
        <option value="available">Available</option>
        <option value="issued">Issued</option>
        <option value="reserved">Reserved</option>
        <option value="lost">Lost</option>
      </select>
    </div>
  );
}
