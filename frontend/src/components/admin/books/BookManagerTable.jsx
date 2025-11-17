import React, { useState } from "react";
import { ChevronDown, Edit2, Trash2, X } from "lucide-react";

/**
 * BookManagerTable - Lean admin table with expandable rows
 * Displays books with searchable metadata and expandable details
 */
export default function BookManagerTable({
  books,
  loading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (bookId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(bookId)) {
      newExpanded.delete(bookId);
    } else {
      newExpanded.add(bookId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      AVAILABLE: "bg-green-100 text-green-800",
      ISSUED: "bg-blue-100 text-blue-800",
      LOST: "bg-red-100 text-red-800",
      DAMAGED: "bg-yellow-100 text-yellow-800",
      REMOVED: "bg-gray-100 text-gray-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
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

  /**
   * Normalize date to YYYY-MM-DD string for comparison
   * Handles various date formats and timezones consistently
   */
  const normalizeDateString = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      // Return ISO date string (YYYY-MM-DD) without timezone info
      return date.toISOString().split("T")[0];
    } catch {
      return null;
    }
  };

  /**
   * Compare two date strings semantically (ignoring format/timezone differences)
   * Returns true if dates represent the same day
   */
  const areDatesSame = (dateStr1, dateStr2) => {
    const normalized1 = normalizeDateString(dateStr1);
    const normalized2 = normalizeDateString(dateStr2);
    return normalized1 && normalized2 && normalized1 === normalized2;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-gray-300">
        <p className="text-gray-600 font-medium">No books found</p>
        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container - Responsive Horizontal Scroll */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="sticky top-0 bg-white z-10 shadow-sm border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-8"></th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">SL No.</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Book Code</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Title</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Author</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">ISBN</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Category</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Shelf</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Updated</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book, idx) => {
                const book_id = book.id || book.book_id;
                const book_code = book.book_code || book.code || "—";
                const isExpanded = expandedRows.has(book_id);
                const title = book.title || book.book_title || "—";
                const author = book.author || book.authors || "—";
                const isbn = book.isbn || book.isbn13 || book.isbn10 || "—";
                const category = book.category || book.categories || "—";
                const shelf = book.shelf_location || book.shelf_number || "—";
                const status = book.status || "AVAILABLE";
                const created_at = book.created_at || "—";
                const updated_at = book.updated_at || "—";
                const description = book.description || "";

                return (
                  <React.Fragment key={book_id}>
                    {/* Main Row */}
                    <tr className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}>
                      {/* Expand Button */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => toggleRow(book_id)}
                          className="text-gray-400 hover:text-gray-600 transition"
                          title="Expand details"
                        >
                          <ChevronDown
                            size={16}
                            className={`transform transition-transform duration-300 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </td>

                      {/* SL No */}
                      <td className="px-3 py-2 text-gray-700 font-medium w-12">{idx + 1}</td>

                      {/* Book Code */}
                      <td className="px-3 py-2 text-gray-700 max-w-[120px] truncate" title={book_code}>
                        {book_code}
                      </td>

                      {/* Title */}
                      <td className="px-3 py-2 text-gray-900 truncate font-medium max-w-[180px]" title={title}>
                        {title}
                      </td>

                      {/* Author */}
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[120px]" title={author}>
                        {author}
                      </td>

                      {/* ISBN */}
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[140px]" title={isbn}>
                        {isbn}
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[120px]" title={category}>
                        {category}
                      </td>

                      {/* Shelf */}
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[80px]" title={shelf}>
                        {shelf}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{formatDate(created_at)}</td>

                      {/* Updated */}
                      <td className="px-3 py-2 text-gray-600 text-xs whitespace-nowrap">{formatDate(updated_at)}</td>

                      {/* Actions - Right Aligned */}
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          onClick={() => onEdit(book)}
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition inline-block"
                          title="Edit book"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => onDelete(book)}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded transition inline-block"
                          title="Delete book"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && (
                      <tr className="border-b border-gray-200 bg-blue-50 transition-all duration-300 ease-in-out">
                        <td colSpan="12" className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-gray-900">Book Details</h4>
                              <button
                                onClick={() => toggleRow(book_id)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Book Code</div>
                                <div className="text-gray-900 mt-1 font-mono">{book_code}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Title</div>
                                <div className="text-gray-900 mt-1">{title}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Author</div>
                                <div className="text-gray-900 mt-1">{author}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">ISBN</div>
                                <div className="text-gray-900 mt-1 font-mono">{isbn}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Category</div>
                                <div className="text-gray-900 mt-1">{category}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Shelf</div>
                                <div className="text-gray-900 mt-1">{shelf}</div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase">Status</div>
                                <div className="mt-1">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                    {status}
                                  </span>
                                </div>
                              </div>
                              {created_at !== "—" && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Created</div>
                                  <div className="text-gray-900 mt-1">{formatDate(created_at)}</div>
                                </div>
                              )}
                              {updated_at !== "—" && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Updated</div>
                                  <div className="text-gray-900 mt-1">{formatDate(updated_at)}</div>
                                </div>
                              )}
                              {book.acquisition_date && !areDatesSame(book.acquisition_date, book.created_at) && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Acquisition Date</div>
                                  <div className="text-gray-900 mt-1">{formatDate(book.acquisition_date)}</div>
                                </div>
                              )}
                              {book.last_activity_date && !areDatesSame(book.last_activity_date, book.updated_at) && (
                                <div>
                                  <div className="text-xs font-semibold text-gray-500 uppercase">Last Activity</div>
                                  <div className="text-gray-900 mt-1">{formatDate(book.last_activity_date)}</div>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {description && (
                              <div className="mt-4 pt-4 border-t border-gray-300">
                                <div className="text-xs font-semibold text-gray-500 uppercase">Description</div>
                                <div className="text-gray-700 mt-2 line-clamp-3">
                                  {description}
                                </div>
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

      {/* Pagination Controls - Compact */}
      <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600 font-medium">
          <span className="hidden sm:inline">Page </span>
          <span className="font-semibold text-gray-900">{currentPage}</span>
          <span className="hidden sm:inline"> of </span>
          <span className="inline sm:hidden">
            {" of "}
          </span>
          <span className="font-semibold text-gray-900">{totalPages}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium whitespace-nowrap"
          >
            ← Prev
          </button>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition font-medium whitespace-nowrap"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
