// src/pages/admin/BooksManager.jsx
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { BookOpen, Plus, Upload } from "lucide-react";
import BookManagerTableCompact from "../../components/admin/books/BookManagerTableCompact";
import AddBook from "../../components/admin/books/AddBook";
import EditBook from "../../components/admin/books/EditBook";
import BulkUploadManager from "../../components/admin/books/BulkUploadManager";
import BarcodeGenerator from "../../components/admin/books/BarcodeGenerator";
import { getBooks, deleteBook, getLibraryMeta } from "../../api/libraryApi";

/**
 * BooksManager Page - Professional Admin Table View
 * Stable, performant admin interface for library book management
 */
export default function BooksManager() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("view");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  const debounceRef = useRef(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const meta = await getLibraryMeta();
        const cats = meta.categories || meta.categories_list || [];
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        console.warn("Failed to load categories:", err.message);
      }
    };
    loadCategories();
  }, []);

  // Load books with proper backend response handling
  const loadBooks = async (pageNum, searchVal, catVal, statusVal) => {
    try {
      setLoading(true);
      const params = { page: pageNum, page_size: pageSize };
      if (searchVal && searchVal.trim()) params.search = searchVal.trim();
      if (catVal && catVal !== "") params.category = catVal;
      if (statusVal && statusVal !== "") params.status = statusVal;

      const response = await getBooks(params);
      
      // Fix: Handle backend's actual response structure
      let booksData = [];
      let count = 0;

      if (response.success && response.data) {
        // Backend returns { success: true, data: [...], count: X, next: ..., previous: ... }
        booksData = Array.isArray(response.data) ? response.data : [];
        count = response.count || 0;
      } else if (response.results) {
        // Fallback for normalized response
        booksData = response.results || [];
        count = response.count || 0;
      } else if (Array.isArray(response)) {
        booksData = response;
        count = response.length;
      }

      setBooks(booksData);
      setTotalCount(count);
    } catch (err) {
      console.error("loadBooks error:", err);
      toast.error("Failed to load books.");
      setBooks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial load - only once
  useEffect(() => {
    loadBooks(1, "", "", "");
  }, []);

  // Debounce filter changes (250ms for search, immediate for dropdowns)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadBooks(1, search, category, status);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [search, category, status]);

  const handleDelete = async (book) => {
    const bookCode = book.book_code || book.code || book.id;
    if (!window.confirm("Delete this book and all its copies?")) return;
    try {
      await deleteBook(bookCode);
      toast.success("Book deleted successfully!");
      loadBooks(page, search, category, status);
    } catch (err) {
      toast.error("Failed to delete book.");
      console.error(err);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
    loadBooks(1, "", "", "");
  };

  const tabs = [
    { id: "view", label: "All Books", icon: BookOpen },
    { id: "add", label: "Add Book", icon: Plus },
    { id: "bulk", label: "Bulk Upload", icon: Upload },
    { id: "barcode", label: "Barcode Generator", icon: BookOpen },
  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        {/* Compact Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Books Manager</h1>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "view" && (
          <div className="space-y-3">
            {/* Compact Filter Row */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2 flex flex-wrap gap-2 items-end">
              <input
                type="text"
                placeholder="Search (title, author, ISBN, code)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-[200px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-w-[140px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => {
                  const name = cat.name || cat.title || cat;
                  const id = cat.slug || cat.id || cat.name || name;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="min-w-[120px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ISSUED">Issued</option>
                <option value="LOST">Lost</option>
                <option value="DAMAGED">Damaged</option>
                <option value="REMOVED">Removed</option>
              </select>

              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium whitespace-nowrap"
              >
                Reset
              </button>
            </div>

            {/* Books Table */}
            <BookManagerTableCompact
              books={books}
              loading={loading}
              onEdit={(book) => {
                setSelectedBook(book);
                setShowEdit(true);
              }}
              onDelete={handleDelete}
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPreviousPage={() => {
                if (page > 1) {
                  const newPage = page - 1;
                  setPage(newPage);
                  loadBooks(newPage, search, category, status);
                }
              }}
              onNextPage={() => {
                if (page < totalPages) {
                  const newPage = page + 1;
                  setPage(newPage);
                  loadBooks(newPage, search, category, status);
                }
              }}
            />
          </div>
        )}

        {activeTab === "add" && (
          <Card variant="elevated" className="p-6">
            <AddBook
              onClose={() => setActiveTab("view")}
              onAdded={() => {
                setActiveTab("view");
                loadBooks(1, "", "", "");
              }}
            />
          </Card>
        )}

        {activeTab === "bulk" && (
          <Card variant="elevated" className="p-6">
            <BulkUploadManager 
              onUploaded={() => {
                loadBooks(1, "", "", "");
                setActiveTab("view");
              }} 
            />
          </Card>
        )}

        {activeTab === "barcode" && (
          <Card variant="elevated" className="p-6">
            <React.Suspense fallback={<div>Loading...</div>}>
              <BarcodeGenerator />
            </React.Suspense>
          </Card>
        )}

        {/* Edit Modal */}
        {showEdit && selectedBook && (
          <EditBook
            book={selectedBook}
            onClose={() => setShowEdit(false)}
            onSubmit={() => {
              setShowEdit(false);
              loadBooks(page, search, category, status);
            }}
          />
        )}
      </div>
    </div>
  );
}
