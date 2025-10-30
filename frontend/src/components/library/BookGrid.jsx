// src/components/library/BookGrid.jsx
import React from "react";
import BookCard from "./BookCard";

const BookGrid = ({ books, userRole, onBorrow }) => {
  if (!books.length) {
    return <p className="text-center text-gray-500 mt-6">No books available.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
      {books.map((book) => (
        <BookCard
          key={book.book_id}
          book={book}
          userRole={userRole}
          onBorrow={onBorrow}
        />
      ))}
    </div>
  );
};

export default BookGrid;
