// src/components/libraryOps/DeleteBook.jsx
import React from "react";
import toast from "react-hot-toast";

export default function DeleteBook({ onDelete, bookId }) {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      onDelete(bookId);
      toast.success("Book deleted successfully!");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-700 font-semibold"
    >
      Delete
    </button>
  );
}
