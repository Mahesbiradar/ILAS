// src/components/books/BookCard.jsx
import React from "react";
import toast from "react-hot-toast";

export default function BookCard({ book, onBorrow, isDisabled = false }) {
  const handleBorrow = () => {
    if (isDisabled) {
      toast.error("Borrow option disabled for admins.");
      return;
    }
    if (onBorrow) onBorrow(book);
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition flex flex-col">
      <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100">
        <img
          src={book.cover_url || "/assets/covers/default.jpg"}
          alt={book.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-3 flex-1">
        <h3 className="font-semibold text-lg">{book.title}</h3>
        <p className="text-gray-600 text-sm">{book.author}</p>
        <p className="text-xs text-gray-500 mt-1">ISBN: {book.isbn}</p>
        <p className="text-xs text-gray-500 mt-1">{book.category}</p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleBorrow}
          disabled={book.quantity <= 0 || isDisabled}
          className={`flex-1 py-2 rounded-md text-white text-sm font-medium ${
            book.quantity > 0 && !isDisabled
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {isDisabled
            ? "Disabled"
            : book.quantity > 0
            ? "Borrow"
            : "Unavailable"}
        </button>
        <div className="text-sm text-gray-500 w-16 text-right">
          Qty: {book.quantity}
        </div>
      </div>
    </div>
  );
}
