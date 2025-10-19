import React from "react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function BookTable({ books, refreshBooks, onEdit }) {
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this book?")) return;
    try {
      await api.delete(`books/${id}/`);
      toast.success("🗑️ Book deleted successfully!");
      refreshBooks();
    } catch {
      toast.error("Failed to delete book.");
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-100 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-blue-100 text-blue-800">
          <tr>
            <th className="p-3 border">#</th>
            <th className="p-3 border text-left">Title</th>
            <th className="p-3 border text-left">Author</th>
            <th className="p-3 border text-left">Category</th>
            <th className="p-3 border text-left">ISBN</th>
            <th className="p-3 border text-left">Publication</th>
            <th className="p-3 border text-center">Qty</th>
            <th className="p-3 border text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((b, i) => (
            <tr key={b.book_id} className="hover:bg-gray-50">
              <td className="p-3 border text-center">{i + 1}</td>
              <td className="p-3 border font-semibold">{b.title}</td>
              <td className="p-3 border">{b.author}</td>
              <td className="p-3 border">{b.category}</td>
              <td className="p-3 border">{b.isbn}</td>
              <td className="p-3 border">{b.publication}</td>
              <td className="p-3 border text-center">{b.quantity}</td>
              <td className="p-3 border text-center">
                <button
                  onClick={() => onEdit(b)}
                  className="text-yellow-600 mr-3 hover:text-yellow-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(b.book_id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
