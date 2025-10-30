import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  getBooks,
  deleteBook,
  downloadBarcodeReport,
} from "../api/libraryApi";
import Loader from "../components/common/Loader";
import AddBook from "../components/libraryOps/AddBook";
import EditBook from "../components/libraryOps/EditBook";
import ViewBarcodes from "../components/libraryOps/ViewBarcodes";

export default function AllBooksManager() {
  // 🧠 Core States
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState({
    next: null,
    previous: null,
    count: 0,
  });
  const [loading, setLoading] = useState(true);

  // 🔎 Filter & Sort States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: "title", direction: "asc" });

  // 📘 Modals & Selection
  const [selected, setSelected] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // -------------------------------------------------------------
  // 📚 Load Books (with Pagination + Filters)
  // -------------------------------------------------------------
  const loadBooks = async (page = 1) => {
    try {
      setLoading(true);
      const data = await getBooks({
        page,
        search: search.trim(),
        category: category !== "All" ? category.trim() : "",
      });

      setBooks(data.results || []);
      setPagination({
        next: data.next,
        previous: data.previous,
        count: data.count,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(1);
  }, []);

  // 🧠 Unique categories
  const categories = useMemo(() => {
    const cats = ["All", ...new Set(books.map((b) => b.category).filter(Boolean))];
    return cats;
  }, [books]);

  // 🔁 Sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...books].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setBooks(sorted);
  };

  // 🔄 Pagination Controls
  const handleNext = () => {
    if (pagination.next) {
      const nextPage = new URL(pagination.next).searchParams.get("page");
      loadBooks(nextPage);
    }
  };

  const handlePrev = () => {
    if (pagination.previous) {
      const prevPage = new URL(pagination.previous).searchParams.get("page");
      loadBooks(prevPage);
    }
  };

  // 🗑️ Delete Book
  const handleDelete = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await deleteBook(bookId);
      toast.success("Book deleted successfully.");
      loadBooks(1);
    } catch (err) {
      toast.error("Error deleting book.");
    }
  };

  // 🖨️ Bulk Barcode Download
  const handleBulkBarcode = async () => {
    if (selected.length === 0) return toast.error("Select books first.");
    try {
      const query = selected.map((id) => `book_ids=${id}`).join("&");
      const res = await downloadBarcodeReport(query);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "barcodes_selected.pdf";
      link.click();
      toast.success("✅ Barcode PDF downloaded!");
    } catch (err) {
      toast.error("Failed to generate barcode PDF.");
    }
  };

  if (loading) return <Loader />;

  // -------------------------------------------------------------
  // 🧩 UI
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-blue-700">📘 All Books Manager</h1>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="🔍 Search by Title / Author / ID"
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
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSearch("");
              setCategory("All");
              toast.success("Filters cleared!");
              loadBooks(1);
            }}
            className="text-gray-600 hover:text-blue-600 text-sm underline"
          >
            Reset
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            ➕ Add Book
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-100 text-blue-800 select-none">
            <tr>
              <th className="p-3 text-left"></th>
              {["book_id", "title", "author", "category", "quantity"].map((key) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="p-3 text-left cursor-pointer hover:text-blue-600"
                >
                  {key.replace("_", " ").toUpperCase()}{" "}
                  {sortConfig.key === key &&
                    (sortConfig.direction === "asc" ? "↑" : "↓")}
                </th>
              ))}
              <th className="p-3 text-left">Shelf</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-gray-500 py-6">
                  No books found.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.book_id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(book.book_id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(book.book_id)
                            ? prev.filter((id) => id !== book.book_id)
                            : [...prev, book.book_id]
                        )
                      }
                    />
                  </td>
                  <td className="p-3 font-medium text-gray-700">{book.book_id}</td>
                  <td className="p-3">{book.title}</td>
                  <td className="p-3">{book.author}</td>
                  <td className="p-3">{book.category}</td>
                  <td className="p-3">{book.quantity}</td>
                  <td className="p-3">{book.shelf_number || "—"}</td>
                  <td className="p-3 flex gap-3">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        setSelectedBook(book);
                        setIsViewModalOpen(true);
                      }}
                    >
                      🏷️
                    </button>
                    <button
                      className="text-yellow-600 hover:text-yellow-800"
                      onClick={() => {
                        setSelectedBook(book);
                        setIsEditModalOpen(true);
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDelete(book.book_id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <p>Total Books: {pagination.count}</p>
        <div className="flex gap-2">
          <button
            onClick={handlePrev}
            disabled={!pagination.previous}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={!pagination.next}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddBook onSubmit={() => loadBooks(1)} onClose={() => setIsAddModalOpen(false)} />
      )}
      {isEditModalOpen && selectedBook && (
        <EditBook
          book={selectedBook}
          onSubmit={() => loadBooks(1)}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {isViewModalOpen && selectedBook && (
        <ViewBarcodes
          bookId={selectedBook.book_id}
          onClose={() => setIsViewModalOpen(false)}
        />
      )}
    </div>
  );
}
