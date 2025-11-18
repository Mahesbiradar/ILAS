// src/components/admin/books/DeleteBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { deleteBook } from "../../../api/libraryApi";
import Loader from "../../common/Loader";

export default function DeleteBook({ bookId, bookTitle, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!bookId) {
      toast.error("❌ Book ID is missing!");
      return;
    }

    const confirmMessage = `⚠️ Are you sure you want to delete "${bookTitle}"?
This will permanently remove the book record and its cover image.`;

    if (!window.confirm(confirmMessage)) return;

    try {
      setLoading(true);

      await deleteBook(bookId);

      toast.success("🗑️ Book deleted successfully!");
      onDeleted?.();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.response?.data?.detail || "❌ Failed to delete book.");
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
        {loading ? "Deleting…" : "Delete"}
      </button>
    </>
  );
}
