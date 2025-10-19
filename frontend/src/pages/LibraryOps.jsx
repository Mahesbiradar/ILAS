// src/pages/LibraryOps.jsx
import React, { useState } from "react";
import AddBook from "../components/libraryOps/AddBook";
import EditBook from "../components/libraryOps/EditBook";
import DeleteBook from "../components/libraryOps/DeleteBook";
import ApproveRequests from "../components/libraryOps/ApproveRequests";

export default function LibraryOps() {
  const [books, setBooks] = useState([]);
  const [editBook, setEditBook] = useState(null);

  const handleAddBook = (newBook) => {
    setBooks((prev) => [...prev, { ...newBook, book_id: Date.now() }]);
  };

  const handleUpdateBook = (updated) => {
    setBooks((prev) =>
      prev.map((b) => (b.book_id === updated.book_id ? updated : b))
    );
    setEditBook(null);
  };

  const handleDeleteBook = (id) => {
    setBooks((prev) => prev.filter((b) => b.book_id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        🏛️ Library Operations (Admin)
      </h1>

      {!editBook ? (
        <AddBook onAdd={handleAddBook} />
      ) : (
        <EditBook
          selectedBook={editBook}
          onUpdate={handleUpdateBook}
          onCancel={() => setEditBook(null)}
        />
      )}

      <div className="bg-white shadow-md rounded-lg p-4 border border-gray-100">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">
          📚 Book Inventory
        </h2>
        {books.length > 0 ? (
          <table className="w-full border-collapse">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="p-3 border">Title</th>
                <th className="p-3 border">Author</th>
                <th className="p-3 border">Category</th>
                <th className="p-3 border text-center">Qty</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b) => (
                <tr key={b.book_id} className="hover:bg-gray-50">
                  <td className="p-3 border">{b.title}</td>
                  <td className="p-3 border">{b.author}</td>
                  <td className="p-3 border">{b.category}</td>
                  <td className="p-3 border text-center">{b.quantity}</td>
                  <td className="p-3 border text-center">
                    <button
                      onClick={() => setEditBook(b)}
                      className="text-yellow-600 mr-3 hover:text-yellow-700 font-semibold"
                    >
                      Edit
                    </button>
                    <DeleteBook onDelete={handleDeleteBook} bookId={b.book_id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500">No books in inventory.</p>
        )}
      </div>

      <ApproveRequests />
    </div>
  );
}
