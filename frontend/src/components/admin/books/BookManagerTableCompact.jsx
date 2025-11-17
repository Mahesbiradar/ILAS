import React, { useState } from "react";
import { ChevronDown, Edit2, Trash2, X } from "lucide-react";

/**
 * BookManagerTable - Compact admin table with minimal columns
 * Columns: SL No, Book Code (link), Title, Author, Shelf, Status + Actions
 */
export default function BookManagerTable({
  books,
  loading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  pageSize = 20,
  onPreviousPage,
  onNextPage,
}) {
  const [expandedId, setExpandedId] = useState(null);

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: "bg-green-100 text-green-800",
      ISSUED: "bg-blue-100 text-blue-800",
      LOST: "bg-red-100 text-red-800",
      DAMAGED: "bg-yellow-100 text-yellow-800",
      REMOVED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600 font-medium">No books found</p>
        <p className="text-gray-500 text-xs mt-1">Try adjusting search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Compact Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 w-8"></th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[60px]">SL No.</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[120px]">Book Code</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700">Title</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[100px]">Author</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-700 min-w-[80px]">Shelf</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-700">Status & Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, idx) => {
                const bookId = book.id || book.book_id;
                const slNo = (currentPage - 1) * pageSize + idx + 1;
                const bookCode = book.book_code || book.code || "—";
                const title = book.title || book.book_title || "—";
                const author = book.author || book.authors || "—";
                const shelf = book.shelf_location || book.shelf_number || "—";
                const status = book.status || "AVAILABLE";
                const isbn = book.isbn || book.isbn13 || book.isbn10 || "—";
                const category = book.category || book.categories || "—";
                const description = book.description || "";

                return (
                  <React.Fragment key={bookId}>
                    {/* Main Row */}
                    <tr className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}>
                      {/* Expand Button */}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setExpandedId(expandedId === bookId ? null : bookId)}
                          className="text-gray-400 hover:text-gray-600 transition"
                          title="Toggle details"
                        >
                          <ChevronDown
                            size={14}
                            className={`transform transition-transform duration-200 ${
                              expandedId === bookId ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* SL No */}
                      <td className="px-2 py-2 text-gray-700 font-medium">{slNo}</td>

                      {/* Book Code - Clickable Link */}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setExpandedId(expandedId === bookId ? null : bookId)}
                          className="text-blue-600 font-semibold max-w-[120px] truncate hover:underline"
                          title={bookCode}
                        >
                          {bookCode}
                        </button>
                      </td>

                      {/* Title */}
                      <td className="px-2 py-2 text-gray-900 max-w-[240px] truncate" title={title}>
                        {title}
                      </td>

                      {/* Author */}
                      <td className="px-2 py-2 text-gray-600 max-w-[100px] truncate" title={author}>
                        {author}
                      </td>

                      {/* Shelf */}
                      <td className="px-2 py-2 text-gray-600 max-w-[80px] truncate" title={shelf}>
                        {shelf}
                      </td>

                      {/* Status & Actions - Right Aligned */}
                      <td className="px-2 py-2 text-right space-x-1">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                        <button
                          onClick={() => onEdit(book)}
                          className="inline-block p-1 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(book)}
                          className="inline-block p-1 text-red-600 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {expandedId === bookId && (
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <td colSpan="7" className="px-4 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">Code</div>
                              <div className="text-gray-900 mt-0.5 font-mono">{bookCode}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">Title</div>
                              <div className="text-gray-900 mt-0.5">{title}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">Author</div>
                              <div className="text-gray-900 mt-0.5">{author}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">ISBN</div>
                              <div className="text-gray-900 mt-0.5 font-mono">{isbn}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">Category</div>
                              <div className="text-gray-900 mt-0.5">{category}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">Shelf</div>
                              <div className="text-gray-900 mt-0.5">{shelf}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-600 uppercase">Status</div>
                              <div className="mt-0.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                              </div>
                            </div>
                            {description && (
                              <div className="sm:col-span-3 lg:col-span-4">
                                <div className="font-semibold text-gray-600 uppercase">Description</div>
                                <div className="text-gray-700 mt-0.5 line-clamp-2">{description}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compact Pagination */}
      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Prev
          </button>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
