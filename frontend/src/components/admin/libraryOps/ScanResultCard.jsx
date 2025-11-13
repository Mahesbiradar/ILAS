// src/components/admin/libraryOps/ScanResultCard.jsx
import React from "react";

const ScanResultCard = ({ data, onApprove, onReturn }) => {
  if (!data) return null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📖 Scanned Book Details
      </h2>
      <div className="space-y-2 text-gray-700">
        <p><strong>Copy ID:</strong> {data.copy_id}</p>
        <p><strong>Title:</strong> {data.book_title}</p>
        <p><strong>Author:</strong> {data.author}</p>
        <p><strong>Category:</strong> {data.category}</p>
        <p><strong>Location:</strong> {data.shelf_number}</p>
        <p><strong>Status:</strong> {data.status}</p>
      </div>

      <div className="flex justify-around mt-5">
        <button
          onClick={onApprove}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Approve Borrow
        </button>
        <button
          onClick={onReturn}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Mark Returned
        </button>
      </div>
    </div>
  );
};

export default ScanResultCard;
