// src/components/libraryOps/DeleteBook.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { deleteBook } from "../../api/libraryApi";
import Loader from "../common/Loader"; // optional overlay loader

export default function DeleteBook({ bookId, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!bookId) return toast.error("Book ID missing!");
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      setLoading(true);
      await deleteBook(bookId);
      toast.success("🗑️ Book deleted successfully!");
      onDeleted?.(); // Refresh parent list
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete book.");
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
        className={`text-red-600 hover:text-red-700 font-semibold ${
          loading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {loading ? "Deleting..." : "Delete"}
      </button>
    </>
  );
}
