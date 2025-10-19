import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";

import BookForm from "../components/books/BookForm";
import BookFilter from "../components/books/BookFilter";
import BookCard from "../components/books/BookCard";
import BookTable from "../components/books/BookTable";

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [borrowed, setBorrowed] = useState([]); // 🔹 User borrow requests
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // ✅ Fetch books
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await api.get("books/");
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch books", err);
      toast.error("Unable to fetch books. Please check the server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch user’s borrowed books
  const fetchBorrowed = async () => {
    if (!user) return;
    try {
      const res = await api.get("borrow/");
      setBorrowed(res.data);
    } catch (err) {
      console.error("Failed to load borrow list", err);
    }
  };

  useEffect(() => {
    fetchBooks();
    if (user?.role === "user") fetchBorrowed();
  }, [user]);

  // ✅ Borrow a book (for users)
  const handleBorrow = async (bookId) => {
    try {
      const res = await api.post("borrow/", { book: bookId });
      toast.success("Borrow request sent!");
      fetchBorrowed();
    } catch (err) {
      console.error("Borrow failed:", err.response?.data || err.message);
      toast.error(
        err.response?.data?.detail || "Could not send borrow request."
      );
    }
  };

  // ✅ Check borrow status for a book
  const getBorrowStatus = (bookId) => {
    const record = borrowed.find((r) => r.book === bookId);
    return record ? record.status : null;
  };

  // 🔹 Filtered book list
  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) &&
      (category ? b.category === category : true)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-700 mb-6">
        📚 Library Books
      </h1>

      <BookFilter
        search={search}
        setSearch={setSearch}
        category={category}
        setCategory={setCategory}
      />

      {/* 🔹 ADMIN VIEW */}
      {user?.role === "admin" ? (
        <>
          <BookForm refreshBooks={fetchBooks} />
          <BookTable books={filteredBooks} refreshBooks={fetchBooks} />
        </>
      ) : (
        /* 🔹 USER VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard
                key={book.book_id}
                book={book}
                onBorrow={handleBorrow}
                status={getBorrowStatus(book.book_id)}
              />
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center">
              No books found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
