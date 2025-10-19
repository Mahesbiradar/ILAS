// src/components/books/BookList.jsx
import React from "react";
import BookCard from "./BookCard";

export default function BookList({ books, onBorrow, userRole }) {
  if (!books.length) {
    return <p className="text-center text-gray-500 mt-6">No books found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
      {books.map((book) => (
        <BookCard
          key={book.book_id}
          book={book}
          onBorrow={onBorrow}
          isDisabled={userRole === "admin"}
        />
      ))}
    </div>
  );
}
