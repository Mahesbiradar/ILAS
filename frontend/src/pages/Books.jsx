// src/pages/Books.jsx
import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";


export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get("books/");
      setBooks(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBooks(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">Library Books</h1>

      {user?.role === "admin" ? (
        <>
          <BookForm refreshBooks={fetchBooks} />
          <BookTable books={books} refreshBooks={fetchBooks} />
        </>
      ) : (
        <BookList books={books} />
      )}
    </div>
  );
}
