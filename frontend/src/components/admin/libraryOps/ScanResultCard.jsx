// src/components/admin/libraryOps/ScanResultCard.jsx
import React from "react";

const ScanResultCard = ({ data = {} }) => {
  if (!data) return null;
  const {
    id,
    book_code,
    title,
    author,
    category,
    shelf_location,
    status,
    issued_to,
    due_date,
  } = data;

  return (
    <div className="bg-white p-4 rounded shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-gray-500">Book Code</div>
          <div className="text-sm font-semibold">{book_code || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">ID</div>
          <div className="text-sm">{id ?? "—"}</div>
        </div>

        <div className="md:col-span-2">
          <div className="text-xs text-gray-500">Title</div>
          <div className="text-sm font-semibold">{title || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Author</div>
          <div className="text-sm">{author || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Category</div>
          <div className="text-sm">{category || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Shelf</div>
          <div className="text-sm">{shelf_location || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Status</div>
          <div className="text-sm">{status || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Issued To</div>
          <div className="text-sm">{issued_to || "—"}</div>
        </div>

        <div>
          <div className="text-xs text-gray-500">Due Date</div>
          <div className="text-sm">{due_date || "—"}</div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultCard;
