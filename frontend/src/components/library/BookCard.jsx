import React from "react";

export default function BookCard({ book }) {
  const cover = book.cover_image || book.cover || book.image || null;
  const title = book.title || book.book_title || "Untitled";
  const author = book.author || book.authors || "Unknown";
  const shelf = book.shelf_location || book.shelf_number || book.location || "—";
  const status = book.status || (book.available ? "AVAILABLE" : "UNAVAILABLE");
  const isbn = book.isbn || book.isbn13 || book.isbn10 || "—";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-3 flex flex-col" style={{ minHeight: 180 }}>
      <div className="flex gap-3">
        <div className="w-28 h-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-50">
          {cover ? (
            <img src={cover} alt={title} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Cover</div>
          )}
        </div>

        <div className="flex-1 pr-1">
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{title}</h3>
          <p className="text-xs text-gray-500 mt-1">{author}</p>

          <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
            <div className="truncate">
              <span className="font-medium">Shelf:</span> {shelf}
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {status}
              </span>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-400">ISBN: {isbn}</div>
        </div>
      </div>
    </div>
  );
}
