import React from "react";

export default function BookCard({ book }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-4 flex flex-col justify-between">
      <div>
        {/* Book Cover */}
        {book.cover_image ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className="w-full h-48 object-cover rounded-lg mb-3"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded-lg mb-3">
            No Image
          </div>
        )}

        {/* Book Info */}
        <h3 className="text-lg font-semibold text-gray-800">{book.title}</h3>
        <p className="text-sm text-gray-500 mt-1">by {book.author}</p>

        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium">Category:</span> {book.category}
          </p>
          <p>
            <span className="font-medium">Shelf:</span>{" "}
            {book.shelf_number || "—"}
          </p>
          <p>
            <span className="font-medium">Available:</span>{" "}
            {book.quantity > 0 ? book.quantity : "Out of stock"}
          </p>
        </div>
      </div>
    </div>
  );
}
