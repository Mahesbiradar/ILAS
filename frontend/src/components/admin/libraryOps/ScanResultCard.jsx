// src/components/admin/libraryOps/ScanResultCard.jsx
import React from "react";

/**
 * Compact, readable book metadata card used across LibraryOperations tabs.
 * UI-only changes: compact spacing, reduced font sizes for better fit.
 *
 * Props:
 *  - data: book object from backend
 */
const ScanResultCard = ({ data = {} }) => {
  if (!data) return null;

  const fmt = (v) => (v === null || v === undefined || v === "" ? "—" : v);
  const fmtCost = (v) =>
    v === null || v === undefined || v === "" ? "—" : `₹ ${v}`;

  return (
    <div className="bg-white rounded-lg border p-3 shadow-sm">
      <h3 className="text-sm font-semibold text-blue-700 mb-2">Book Details</h3>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
        <Meta label="Book Code" value={fmt(data.book_code)} />
        <Meta label="ID" value={fmt(data.id)} />

        <Meta label="Title" value={fmt(data.title)} wide />
        <Meta label="Author" value={fmt(data.author)} />

        <Meta label="Category" value={fmt(data.category)} />
        <Meta label="Shelf" value={fmt(data.shelf_location || data.shelf)} />

        <Meta label="Status" value={fmt(data.status)} />
        <Meta label="Issued To" value={fmt(data.issued_to)} />

        <Meta label="Due Date" value={fmt(data.due_date)} />
        <Meta label="Publisher" value={fmt(data.publisher)} />

        <Meta label="Edition" value={fmt(data.edition)} />
        <Meta label="ISBN" value={fmt(data.isbn)} />

        <Meta label="Language" value={fmt(data.language)} />
        <Meta label="Publication Year" value={fmt(data.publication_year)} />

        {/* Extra fields requested */}
        <Meta label="Accession No." value={fmt(data.accession_no)} />
        <Meta label="Source" value={fmt(data.source)} />
        <Meta label="Condition" value={fmt(data.condition)} />
        <Meta label="Book Cost" value={fmtCost(data.book_cost)} />
      </div>

      {(data.description || data.remarks) && (
        <div className="mt-2 text-xs text-gray-700">
          {data.description && (
            <>
              <div className="text-[10px] text-gray-500">Description</div>
              <div className="text-xs text-gray-700">{data.description}</div>
            </>
          )}
          {data.remarks && (
            <>
              <div className="text-[10px] text-gray-500 mt-1">Remarks</div>
              <div className="text-xs text-gray-700">{data.remarks}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

function Meta({ label, value, wide }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-800">{value}</div>
    </div>
  );
}

export default ScanResultCard;
