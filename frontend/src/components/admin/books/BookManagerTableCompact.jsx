import React, { useState } from "react";
import { ChevronDown, Edit2, Trash2 } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!books.length) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600 font-medium">No books found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="space-y-4">
        {/* DESKTOP TABLE */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 w-8"></th>
                  <th className="px-2 py-2 text-left">SL No.</th>
                  <th className="px-2 py-2 text-left">Book Code</th>
                  <th className="px-2 py-2 text-left">Title</th>
                  <th className="px-2 py-2 text-left">Author</th>
                  <th className="px-2 py-2 text-left">Shelf</th>
                  <th className="px-2 py-2 text-right">Status & Actions</th>
                </tr>
              </thead>

              <tbody>
                {books.map((book, idx) => {
                  const bookId = book.id || book.book_id;
                  const slNo = (currentPage - 1) * pageSize + idx + 1;

                  const bookCode = book.book_code || "—";
                  const title = book.title || "—";
                  const author = book.author || "—";
                  const publisher = book.publisher || "—";
                  const edition = book.edition || "—";
                  const publicationYear = book.publication_year || "—";
                  const isbn = book.isbn || "—";
                  const language = book.language || "—";
                  const category = book.category || "—";
                  const accessionNo = book.accession_no || "—";
                  const shelf = book.shelf_location || "—";
                  const condition = book.condition || "—";
                  const source = book.source || "—";
                  const remarks = book.remarks || "—";
                  const status = book.status || "AVAILABLE";
                  const description = book.description || "";

                  return (
                    <React.Fragment key={bookId}>
                      {/* MAIN ROW */}
                      <tr className="border-b border-gray-200 hover:bg-blue-50">
                        <td className="px-2 py-2">
                          <button
                            onClick={() =>
                              setExpandedId(expandedId === bookId ? null : bookId)
                            }
                          >
                            <ChevronDown
                              size={14}
                              className={`transition ${expandedId === bookId ? "rotate-180" : ""
                                }`}
                            />
                          </button>
                        </td>

                        <td className="px-2 py-2">{slNo}</td>

                        <td className="px-2 py-2 text-blue-600 font-semibold">
                          {bookCode}
                        </td>

                        <td className="px-2 py-2 truncate max-w-[240px]">
                          {title}
                        </td>

                        <td className="px-2 py-2 truncate max-w-[120px]">
                          {author}
                        </td>

                        <td className="px-2 py-2">{shelf}</td>

                        <td className="px-2 py-2 text-right space-x-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusColor(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                          <button
                            onClick={() => onEdit(book)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(book)}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>

                      {/* EXPANDED DROPDOWN */}
                      {expandedId === bookId && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan="7" className="px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                              <Field label="Title" value={title} />
                              <Field label="Author" value={author} />
                              <Field label="Publisher" value={publisher} />
                              <Field label="Edition" value={edition} />
                              <Field label="Publication Year" value={publicationYear} />
                              <Field label="ISBN" value={isbn} mono />
                              <Field label="Language" value={language} />
                              <Field label="Category" value={category} />
                              <Field label="Accession No" value={accessionNo} mono />
                              <Field label="Shelf Location" value={shelf} />
                              <Field label="Condition" value={condition} />
                              <Field label="Source" value={source} />
                              <Field label="Remarks" value={remarks} />

                              {description && (
                                <div className="col-span-full">
                                  <div className="font-semibold text-gray-600 uppercase">
                                    Description
                                  </div>
                                  <div className="text-gray-700 mt-0.5">
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

        {/* MOBILE LIST (md:hidden) */}
        <div className="md:hidden space-y-4">
          {books.map((book) => {
            const bookId = book.id || book.book_id;
            const bookCode = book.book_code || "—";
            const title = book.title || "—";
            const author = book.author || "—";
            const status = book.status || "AVAILABLE";
            const shelf = book.shelf_location || "—";
            const isExpanded = expandedId === bookId;

            // Reuse vars for extended details
            const publisher = book.publisher || "—";
            const edition = book.edition || "—";
            const publicationYear = book.publication_year || "—";
            const isbn = book.isbn || "—";
            const language = book.language || "—";
            const category = book.category || "—";
            const accessionNo = book.accession_no || "—";
            const condition = book.condition || "—";
            const source = book.source || "—";
            const remarks = book.remarks || "—";
            const description = book.description || "";

            return (
              <div key={bookId} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-blue-600 font-bold mb-1">{bookCode}</span>
                    <h3 className="font-semibold text-gray-900 leading-tight">{title}</h3>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(status)}`}
                  >
                    {status}
                  </span>
                </div>

                {/* Sub Details */}
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[60px]">Author:</span>
                    <span className="text-gray-800">{author}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium min-w-[60px]">Shelf:</span>
                    <span className="text-gray-800">{shelf}</span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex gap-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(book)}
                    className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(book)}
                    className="flex-1 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>

                {/* Expand Toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : bookId)}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-gray-500 font-medium py-1 hover:bg-gray-50 rounded"
                >
                  {isExpanded ? "Hide Details" : "Show Details"}
                  <ChevronDown size={14} className={`transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                    <Field label="Publisher" value={publisher} />
                    <Field label="Edition" value={edition} />
                    <Field label="Year" value={publicationYear} />
                    <Field label="ISBN" value={isbn} mono />
                    <Field label="Language" value={language} />
                    <Field label="Category" value={category} />
                    <Field label="Accession No" value={accessionNo} mono />
                    <Field label="Condition" value={condition} />
                    <Field label="Source" value={source} />
                    <Field label="Remarks" value={remarks} />
                    {description && (
                      <div className="col-span-2 mt-2">
                        <div className="font-semibold text-gray-500 uppercase">Description</div>
                        <p className="text-gray-700 mt-1">{description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-200">
        <span className="text-xs text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onPreviousPage}
            disabled={currentPage === 1}
            className="px-2 py-1 text-xs border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="px-2 py-1 text-xs border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* Reusable field */
function Field({ label, value, mono = false }) {
  return (
    <div>
      <div className="font-semibold text-gray-600 uppercase">{label}</div>
      <div className={`mt-0.5 text-gray-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
