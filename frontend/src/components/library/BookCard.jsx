import React from "react";

export default function BookCard({ book }) {
// Normalize backend root (remove trailing slash + remove /api prefix)
let backend = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// Remove /api or /api/ from end
backend = backend.replace(/\/api\/?$/, "");

  const isFullUrl = (url) =>
    url?.startsWith("http://") || url?.startsWith("https://");

  // Correct URL logic
  const cover = book.cover_image
    ? isFullUrl(book.cover_image)
      ? book.cover_image
      : `${backend}${book.cover_image}`
    : `${backend}/media/no-cover.png`;

  const title = book.title || "Untitled";
  const author = book.author || "Unknown";
  const shelf = book.shelf_location || "—";
  const status = book.status || "AVAILABLE";
  const isbn = book.isbn || "—";

  return (
    <div className="w-full h-[360px] bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-3 flex flex-col">
      <div className="w-full h-44 rounded-md overflow-hidden bg-gray-50 mb-3">
        <img
          src={cover}
          alt={title}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `${backend}/media/no-cover.png`;
          }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{author}</p>

        <div className="mt-2 text-xs text-gray-600 line-clamp-1">
          <span className="font-medium">Shelf:</span> {shelf}
        </div>

        <div className="mt-1">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              status === "AVAILABLE"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="mt-2 text-xs text-gray-400">ISBN: {isbn}</div>
      </div>
    </div>
  );
}
