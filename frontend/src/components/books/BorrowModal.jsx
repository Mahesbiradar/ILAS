// src/components/books/BorrowModal.jsx
import React from "react";

export default function BorrowModal({ book, onConfirm, onCancel }) {
  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Borrow "{book.title}"?
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Author: {book.author} <br />
          ISBN: {book.isbn}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(book)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
