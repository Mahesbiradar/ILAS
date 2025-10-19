import React from "react";
import toast from "react-hot-toast";

export default function BookCard({ book, onBorrow, status }) {
  // 🧠 Decide button label and color based on borrow status
  const getStatusButton = () => {
    switch (status) {
      case "pending":
        return (
          <button
            disabled
            className="w-full px-4 py-2 rounded bg-yellow-500 text-white cursor-not-allowed"
          >
            ⏳ Pending Approval
          </button>
        );
      case "approved":
        return (
          <button
            disabled
            className="w-full px-4 py-2 rounded bg-green-600 text-white cursor-not-allowed"
          >
            ✅ Approved
          </button>
        );
      case "returned":
        return (
          <button
            disabled
            className="w-full px-4 py-2 rounded bg-gray-400 text-white cursor-not-allowed"
          >
            📦 Returned
          </button>
        );
      default:
        return (
          <button
            onClick={() => {
              if (book.quantity <= 0)
                toast.error("Book unavailable for borrowing.");
              else onBorrow(book.book_id);
            }}
            className={`w-full px-4 py-2 rounded transition ${
              book.quantity > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
            disabled={book.quantity <= 0}
          >
            {book.quantity > 0 ? "Borrow Book 📚" : "Unavailable"}
          </button>
        );
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
      <img
        src={
          book.cover_image
            ? `http://127.0.0.1:8000${book.cover_image}`
            : "/assets/covers/default.jpg"
        }
        alt={book.title}
        className="w-full h-48 object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold text-lg">{book.title}</h3>
      <p className="text-gray-600 text-sm">{book.author}</p>
      <p className="text-gray-500 text-sm mb-2">
        ISBN: {book.isbn || "N/A"} | Qty: {book.quantity}
      </p>
      {getStatusButton()}
    </div>
  );
}
