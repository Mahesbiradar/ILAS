import React from "react";

export default function BookCard({ book }) {
  const book_id = book.id || book.book_id || null;
  const coverPath = book_id ? `/media/book_covers/${book_id}.jpg` : null;
  const cover = book.cover_image || book.cover || book.image || coverPath || null;
  const title = book.title || book.book_title || "Untitled";
  const author = book.author || book.authors || "Unknown";
  const shelf = book.shelf_location || book.shelf_number || book.location || "—";
  const status = book.status || (book.available ? "AVAILABLE" : "UNAVAILABLE");
  const isbn = book.isbn || book.isbn13 || book.isbn10 || "—";

  return (
    <div className="max-w-[260px] bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all p-3 flex flex-col">
      <div className="w-full h-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-50 mb-2">
        {cover ? (
          <img 
            src={cover} 
            alt={title} 
            loading="lazy" 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // Guard against infinite retry loop: only replace src once
              if (!e.target.getAttribute('data-fallback-used')) {
                e.target.setAttribute('data-fallback-used', 'true');
                e.target.onerror = null; // Remove handler to prevent re-triggering
                e.target.src = '/no-cover.png';
              } else {
                console.warn(`Failed to load both book cover (${cover}) and fallback image`, e);
              }
            }}
          />
        ) : (
          <img src="/no-cover.png" alt="No cover" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{author}</p>

        <div className="mt-2 text-xs text-gray-600">
          <div className="line-clamp-1">
            <span className="font-medium">Shelf:</span> {shelf}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {status}
          </span>
        </div>

        <div className="mt-2 text-xs text-gray-400 line-clamp-1">ISBN: {isbn}</div>
      </div>
    </div>
  );
}
