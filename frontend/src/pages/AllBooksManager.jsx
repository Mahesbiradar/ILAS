// src/pages/AllBooksManager.jsx
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Loader from "../components/common/Loader";
import AddBook from "../components/libraryOps/AddBook";
import EditBook from "../components/libraryOps/EditBook";
import ViewBarcodes from "../components/libraryOps/ViewBarcodes";
import BookCopiesManager from "../components/libraryOps/BookCopiesManager";
import BulkUploadManager from "../components/libraryOps/BulkUploadManager"; // ✅ NEW modular component

import {
  getBooks,
  deleteBook,
  bulkDeleteBooks,
  downloadSelectedBarcodesPDF,
  downloadAllBarcodesPDF,
} from "../api/libraryApi";

export default function AllBooksManager() {
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [selected, setSelected] = useState([]);
  const [expandedBook, setExpandedBook] = useState(null);

  // Modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showBarcode, setShowBarcode] = useState(null);

  // ========================= LOAD BOOKS =========================
  const loadBooks = async (p = 1, keepExpanded = false) => {
    try {
      setLoading(true);
      const params = { page: p, search: search.trim() };
      if (category !== "All") params.category = category;
      const data = await getBooks(params);

      setBooks(data.results || []);
      setPagination({
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      });
      setPage(p);

      const cats = new Set(["All"]);
      (data.results || []).forEach((b) => b.category && cats.add(b.category));
      setCategories(Array.from(cats));

      if (!keepExpanded) setExpandedBook(null);
    } catch (err) {
      console.error("loadBooks error:", err);
      toast.error("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadBooks(1), 400);
    return () => clearTimeout(t);
  }, [search, category]);

  // ========================= CRUD =========================
  const handleDeleteBook = async (bookCode) => {
    if (!window.confirm("Delete this book and all its copies?")) return;
    try {
      await deleteBook(bookCode);
      toast.success("Book deleted successfully!");
      loadBooks(page, true);
    } catch (err) {
      console.error("deleteBook error:", err);
      toast.error("Failed to delete book.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return toast.error("No books selected!");
    if (!window.confirm(`Delete ${selected.length} selected book(s)?`)) return;
    try {
      toast.loading("Deleting selected books...", { id: "bulkDelete" });
      await bulkDeleteBooks(selected);
      toast.success("Selected books deleted!", { id: "bulkDelete" });
      setSelected([]);
      loadBooks(page);
    } catch (err) {
      console.error("bulkDelete error:", err);
      toast.error("Bulk delete failed.", { id: "bulkDelete" });
    }
  };

  // ========================= BARCODE DOWNLOAD =========================
  const handleBulkBarcode = async () => {
    if (!selected.length) return toast.error("Select books first!");
    try {
      const res = await downloadSelectedBarcodesPDF(selected);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SelectedBooks_Barcodes.pdf";
      a.click();
      toast.success("📥 Barcode PDF downloaded!");
    } catch (err) {
      console.error("downloadSelectedBarcodesPDF error:", err);
      toast.error("Failed to download barcodes.");
    }
  };

  const handleDownloadAllBarcodes = async () => {
    try {
      const res = await downloadAllBarcodesPDF();
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "AllBooks_Barcodes.pdf";
      a.click();
      toast.success("📥 All barcodes downloaded!");
    } catch (err) {
      console.error("downloadAllBarcodesPDF error:", err);
      toast.error("Failed to download all barcodes.");
    }
  };

  const totalPages = Math.max(1, Math.ceil((pagination.count || 0) / 10));
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    loadBooks(newPage);
  };

  if (loading) return <Loader overlay />;

  // ========================= UI =========================
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h1 className="text-3xl font-bold text-blue-700">📚 All Books Manager</h1>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by Title / Author / Code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch("");
              setCategory("All");
              loadBooks(1);
            }}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 shadow-sm"
          >
            Reset
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
          >
            ➕ Add Book
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={!selected.length}
            className={`px-4 py-2 rounded-lg text-white transition ${
              selected.length
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            🗑️ Delete Selected ({selected.length})
          </button>
          <button
            onClick={handleBulkBarcode}
            disabled={!selected.length}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            🏷️ Download Barcodes
          </button>
          <button
            onClick={handleDownloadAllBarcodes}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            🌐 Download All Barcodes
          </button>

          {/* ✅ New Modular Bulk Upload Component */}
          <BulkUploadManager onUploaded={() => loadBooks(page)} />
        </div>
      </div>

      {/* Books Table */}
      <BooksTable
        books={books}
        expandedBook={expandedBook}
        setExpandedBook={setExpandedBook}
        selected={selected}
        setSelected={setSelected}
        handleDeleteBook={handleDeleteBook}
        setShowEdit={setShowEdit}
        setShowBarcode={setShowBarcode}
        loadBooks={loadBooks}
      />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        pagination={pagination}
        handlePageChange={handlePageChange}
      />

      {/* Modals */}
      {showAdd && <AddBook onAdded={() => loadBooks(page)} onClose={() => setShowAdd(false)} />}
      {showEdit && (
        <EditBook
          book={showEdit}
          onSubmit={() => loadBooks(page, true)}
          onClose={() => setShowEdit(null)}
        />
      )}
      {showBarcode && (
        <ViewBarcodes
          bookCode={showBarcode.book_code}
          selectedCodes={selected}
          onClose={() => setShowBarcode(null)}
        />
      )}
    </div>
  );
}

// ========================= Reusable Components =========================

function BooksTable({ books, expandedBook, setExpandedBook, selected, setSelected, handleDeleteBook, setShowEdit, setShowBarcode, loadBooks }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-lg overflow-x-auto">
      <table className="min-w-full text-sm text-gray-700">
        <thead className="bg-blue-50 text-blue-800 font-semibold">
          <tr>
            <th className="p-3 text-center border-b">
              <input
                type="checkbox"
                checked={books.length > 0 && books.every((b) => selected.includes(b.book_code))}
                onChange={() =>
                  setSelected(
                    books.every((b) => selected.includes(b.book_code))
                      ? []
                      : books.map((b) => b.book_code)
                  )
                }
              />
            </th>
            <th className="p-3 border-b text-left">Book Code</th>
            <th className="p-3 border-b text-left">Title</th>
            <th className="p-3 border-b text-left">Author</th>
            <th className="p-3 border-b text-left">Category</th>
            <th className="p-3 border-b text-center">Qty</th>
            <th className="p-3 border-b text-center">Shelf</th>
            <th className="p-3 border-b text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.length ? (
            books.map((book) => (
              <React.Fragment key={book.book_code}>
                <tr
                  className={`hover:bg-blue-50 transition ${
                    expandedBook === book.book_code ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(book.book_code)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(book.book_code)
                            ? prev.filter((id) => id !== book.book_code)
                            : [...prev, book.book_code]
                        )
                      }
                    />
                  </td>
                  <td className="p-3 font-semibold">{book.book_code}</td>
                  <td
                    onClick={() => setExpandedBook(expandedBook === book.book_code ? null : book.book_code)}
                    className="p-3 text-blue-700 cursor-pointer hover:underline"
                  >
                    {book.title}
                  </td>
                  <td className="p-3">{book.author || "—"}</td>
                  <td className="p-3">{book.category || "—"}</td>
                  <td className="p-3 text-center">{book.quantity}</td>
                  <td className="p-3 text-center">{book.shelf_location || "—"}</td>
                  <td className="p-3 flex justify-center gap-3">
                    <button onClick={() => setShowEdit(book)} title="Edit" className="text-yellow-600 hover:text-yellow-800">✏️</button>
                    <button onClick={() => handleDeleteBook(book.book_code)} title="Delete" className="text-red-600 hover:text-red-800">🗑️</button>
                    <button onClick={() => setShowBarcode(book)} title="Barcodes" className="text-blue-600 hover:text-blue-800">🏷️</button>
                  </td>
                </tr>

                {expandedBook === book.book_code && (
                  <tr>
                    <td colSpan="100%" className="bg-blue-50 p-4 text-gray-700">
                      <BookCopiesManager bookCode={book.book_code} onUpdated={() => loadBooks()} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center py-6 text-gray-500">
                No books found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Pagination({ page, totalPages, pagination, handlePageChange }) {
  return (
    <div className="flex justify-between items-center mt-6">
      <span className="text-sm text-gray-600">
        Showing page {page} of {totalPages} ({pagination.count} total books)
      </span>
      <div className="flex gap-1 flex-wrap justify-center">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => handlePageChange(i + 1)}
            className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${
              page === i + 1
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 hover:bg-blue-50 border-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
