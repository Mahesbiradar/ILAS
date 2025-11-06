// src/components/libraryOps/DeleteBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { deleteBook } from "../../api/libraryApi";
import Loader from "../common/Loader";

export default function DeleteBook({ bookId, bookTitle, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!bookId) {
      toast.error("Book ID missing!");
      return;
    }

    const confirmMessage = `
⚠️ Are you sure you want to delete "${bookTitle || "this book"}"?
This will permanently remove:
• The book record
• All its physical copies (BookCopies)
• All associated barcodes & cover images
`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await deleteBook(bookId);
      toast.success("🗑️ Book and all copies deleted successfully!");
      onDeleted?.(); // Refresh parent list
    } catch (err) {
      console.error("DeleteBook error:", err);
      const msg =
        err.response?.data?.detail ||
        "Failed to delete book. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader overlay />}
      <button
        onClick={handleDelete}
        disabled={loading}
        className={`text-red-600 hover:text-red-700 font-semibold transition ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Deleting..." : "Delete"}
      </button>
    </>
  );
}
