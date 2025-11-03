// src/pages/AllBooksManager.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "../api/axios";
import toast from "react-hot-toast";
import Loader from "../components/common/Loader";
import AddBook from "../components/libraryOps/AddBook";
import EditBook from "../components/libraryOps/EditBook";
import ViewBarcodes from "../components/libraryOps/ViewBarcodes";
import {
  getBooks,
  getBookDetails,
  deleteBook,
  bulkDeleteBooks,
  bulkUploadBooks,
  downloadTemplate,
  downloadBarcodeReport,
} from "../api/libraryApi";

export default function AllBooksManager() {
  const [books, setBooks] = useState([]);
  const [allBooksForCategories, setAllBooksForCategories] = useState([]);
  const [pagination, setPagination] = useState({ next: null, previous: null, count: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expandedBookCode, setExpandedBookCode] = useState(null);
  const [bookCopies, setBookCopies] = useState({});
  const [selected, setSelected] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // ---------------- LOAD BOOKS ----------------
  const loadBooks = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, search: search.trim() };
      if (category && category !== "All") params.category = category;
      const data = await getBooks(params);
      setBooks(data.results || []);
      setPagination({ next: data.next, previous: data.previous, count: data.count });
    } catch (err) {
      console.error("loadBooks:", err);
      toast.error("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllBooksForCategories = async () => {
    try {
      const data = await getBooks({ page: 1, page_size: 1000, search: "" });
      setAllBooksForCategories(data.results || []);
    } catch (err) {
      console.warn("Could not fetch categories", err);
    }
  };

  useEffect(() => {
    loadBooks(1);
    loadAllBooksForCategories();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => loadBooks(1), 350);
    return () => clearTimeout(t);
  }, [search, category]);

  const categories = useMemo(() => {
    const setCats = new Set(["All"]);
    (allBooksForCategories || []).forEach((b) => b.category && setCats.add(b.category));
    return Array.from(setCats);
  }, [allBooksForCategories]);

  // ---------------- BULK OPERATIONS ----------------
  const handleBulkUpload = async () => {
    if (!excelFile) return toast.error("Select Excel file!");
    try {
      setUploading(true);
      toast.loading("Uploading...", { id: "upload" });
      const formData = new FormData();
      formData.append("file", excelFile);
      if (zipFile) formData.append("images", zipFile);
      await bulkUploadBooks(formData);
      toast.success("Books uploaded successfully!", { id: "upload" });
      setExcelFile(null);
      setZipFile(null);
      setShowBulkOps(false);
      await loadBooks();
    } catch (err) {
      console.error("Bulk upload failed:", err);
      toast.error("Upload failed", { id: "upload" });
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateDownload = async () => {
    try {
      const res = await downloadTemplate();
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Book_Upload_Template.xlsx";
      a.click();
      toast.success("Template downloaded!");
    } catch {
      toast.error("Failed to download template.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return toast.error("No books selected!");
    if (!window.confirm(`Delete ${selected.length} books?`)) return;
    try {
      await bulkDeleteBooks(selected);
      toast.success("Books deleted successfully!");
      setSelected([]);
      await loadBooks();
    } catch {
      toast.error("Failed to delete books.");
    }
  };

  const handleBulkBarcode = async () => {
    if (!selected.length) return toast.error("Select books first!");
    try {
      const query = selected.map((id) => `book_ids=${encodeURIComponent(id)}`).join("&");
      const res = await downloadBarcodeReport(query);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "barcodes_selected.pdf";
      a.click();
      toast.success("Barcodes downloaded!");
    } catch {
      toast.error("Failed to generate barcodes.");
    }
  };

  // ---------------- COPIES ----------------
  const toggleCopies = async (book) => {
    const bookCode = book.book_code;
    if (expandedBookCode === bookCode) return setExpandedBookCode(null);
    try {
      const details = await getBookDetails(bookCode);
      setBookCopies((p) => ({ ...p, [bookCode]: details.copies || [] }));
      setExpandedBookCode(bookCode);
    } catch {
      toast.error("Failed to load copies.");
    }
  };

  // ---------------- PAGINATION ----------------
  const handlePageChange = async (pageUrl) => {
    if (!pageUrl || pageUrl === "null") return;
    try {
      const url = new URL(pageUrl);
      const page = url.searchParams.get("page");
      if (!page) return;
      await loadBooks(page);
    } catch (err) {
      console.warn("Invalid page URL:", pageUrl);
    }
  };

  if (loading) return <Loader overlay />;

  // ---------------- UI ----------------
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h1 className="text-3xl font-bold text-blue-700">📘 All Books Manager</h1>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by Title / Author / ID"
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
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
          >
            ➕ Add Book
          </button>

          <button
            onClick={handleBulkDelete}
            disabled={!selected.length}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            🗑️ Delete Selected
          </button>

          <button
            onClick={handleBulkBarcode}
            disabled={!selected.length}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            🏷️ Download Barcodes
          </button>
        </div>
      </div>

      {/* Collapsible Bulk Operations */}
      <div className="bg-white shadow-md border border-gray-200 rounded-lg">
        <div
          onClick={() => setShowBulkOps((p) => !p)}
          className="flex justify-between items-center cursor-pointer px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition"
        >
          <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-lg">
            📦 Bulk Operations
          </h2>
          <span className="text-sm text-gray-500">{showBulkOps ? "▲ Hide" : "▼ Show"}</span>
        </div>

        {showBulkOps && (
          <div className="p-4 space-y-4 animate-fadeIn">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <label className="flex flex-col text-sm font-medium text-gray-600">
                Excel File (.xlsx)
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(e) => setExcelFile(e.target.files[0])}
                  className="border border-gray-300 rounded-md p-2 mt-1 w-64"
                />
              </label>

              <label className="flex flex-col text-sm font-medium text-gray-600">
                Images ZIP (optional)
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files[0])}
                  className="border border-gray-300 rounded-md p-2 mt-1 w-64"
                />
              </label>

              <button
                onClick={handleBulkUpload}
                disabled={uploading}
                className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>

              <button
                onClick={handleTemplateDownload}
                className="text-blue-600 text-sm underline hover:text-blue-800"
              >
                📄 Download Template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Books Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-blue-50 text-blue-800">
            <tr>
              <th className="p-3 border-b">
                <input
                  type="checkbox"
                  checked={books.length > 0 && books.every((b) => selected.includes(b.book_code))}
                  onChange={() => {
                    if (books.every((b) => selected.includes(b.book_code)))
                      setSelected([]);
                    else
                      setSelected(books.map((b) => b.book_code));
                  }}
                />
              </th>
              <th className="p-3 border-b text-left">BOOK ID</th>
              <th className="p-3 border-b text-left">TITLE</th>
              <th className="p-3 border-b text-left">AUTHOR</th>
              <th className="p-3 border-b text-left">CATEGORY</th>
              <th className="p-3 border-b text-center">QUANTITY</th>
              <th className="p-3 border-b text-center">SHELF</th>
              <th className="p-3 border-b text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {books.length ? (
              books.map((book, idx) => (
                <React.Fragment key={book.book_code}>
                  <tr
                    className={`transition hover:bg-blue-50 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
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
                      className="p-3 text-blue-700 cursor-pointer hover:underline"
                      onClick={() => toggleCopies(book)}
                    >
                      {book.title}
                    </td>
                    <td className="p-3">{book.author}</td>
                    <td className="p-3">{book.category || "—"}</td>
                    <td className="p-3 text-center">{book.quantity}</td>
                    <td className="p-3 text-center">{book.shelf_number || "—"}</td>
                    <td className="p-3 text-center text-lg flex justify-center gap-4">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        title="View Barcodes"
                        onClick={() => {
                          setSelectedBook(book);
                          setIsViewModalOpen(true);
                        }}
                      >
                        🏷️
                      </button>
                      <button
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Edit"
                        onClick={() => {
                          setSelectedBook(book);
                          setIsEditModalOpen(true);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                        onClick={() => handleBulkDelete(book)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-gray-500 py-6">
                  No books found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-700">
        <span>Total Books: {pagination.count}</span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(pagination.previous)}
            disabled={!pagination.previous}
            className="px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            ⬅ Prev
          </button>
          <button
            onClick={() => handlePageChange(pagination.next)}
            disabled={!pagination.next}
            className="px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddBook onAdded={() => loadBooks()} onClose={() => setIsAddModalOpen(false)} />
      )}
      {isEditModalOpen && selectedBook && (
        <EditBook
          book={selectedBook}
          onSubmit={() => {
            loadBooks();
            setIsEditModalOpen(false);
          }}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {isViewModalOpen && selectedBook && (
        <ViewBarcodes
          bookId={selectedBook.book_code}
          selectedIds={selected}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
}
