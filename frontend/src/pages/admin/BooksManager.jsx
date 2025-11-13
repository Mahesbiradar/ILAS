// src/pages/admin/BooksManager.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { BookOpen, Plus, Upload, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Card, PageTitle, SectionHeader, EmptyState, Input, Loader } from "../../components/common";
import BarcodeGenerator from "../../components/admin/books/BarcodeGenerator";
import BookCard from "../../components/library/BookCard";
import AddBook from "../../components/admin/books/AddBook";
import EditBook from "../../components/admin/books/EditBook";
import BulkUploadManager from "../../components/admin/books/BulkUploadManager";
import { getBooks, deleteBook, bulkDeleteBooks } from "../../api/libraryApi";
import { usePagination } from "../../hooks/usePagination";

/**
 * BooksManager Page - Modernized
 * Consolidated admin page for managing all books with modern UI
 */
export default function BooksManager() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [activeTab, setActiveTab] = useState("view");
  const [selectedBook, setSelectedBook] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  const pagination = usePagination(50);

  const loadBooks = useCallback(async (opts = {}) => {
    const p = opts.page ?? pagination.page;
    const s = opts.search ?? search;
    const c = opts.category ?? category;

    try {
      setLoading(true);
      const params = { page: p, page_size: pagination.pageSize };
      if (s && s.trim()) params.search = s.trim();
      if (c !== "All") params.category = c;

      const data = await getBooks(params);
      // Handle backend shapes: { success, data, count } or normalized { results, count }
      let results = [];
      let count = 0;
      let next = null;
      let previous = null;

      if (data) {
        if (data.success && data.data) {
          results = data.data;
          count = data.count || results.length;
        } else if (data.results) {
          results = data.results;
          count = data.count || results.length;
          next = data.next;
          previous = data.previous;
        } else if (Array.isArray(data)) {
          results = data;
          count = data.length;
        }
      }

      setBooks(results || []);
      pagination.setPaginationData({ count, next, previous, results });
      pagination.setPage(p);

      // Extract categories from results
      const cats = new Set(["All"]);
      (data.results || []).forEach((b) => b.category && cats.add(b.category));
      setCategories(Array.from(cats));
    } catch (err) {
      console.error("loadBooks error:", err);
      toast.error("Failed to load books.");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [pagination, search, category]);

  // Initial load
  useEffect(() => {
    loadBooks({ page: 1, search, category });
  }, []);

  // Debounce search and category changes
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadBooks({ page: 1, search, category });
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search, category, loadBooks]);

  const handleDelete = async (bookCode) => {
    if (!window.confirm("Delete this book and all its copies?")) return;
    try {
      await deleteBook(bookCode);
      toast.success("Book deleted successfully!");
      loadBooks({ page: pagination.page });
    } catch (err) {
      toast.error("Failed to delete book.");
    }
  };

  const tabs = [
    { id: "view", label: "All Books", icon: BookOpen },
    { id: "add", label: "Add Book", icon: Plus },
    { id: "bulk", label: "Bulk Upload", icon: Upload },
    { id: "barcode", label: "Barcode Generator", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <PageTitle 
          title="Books Manager" 
          subtitle="Manage your library's book collection"
          icon={BookOpen}
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-md font-medium transition-all duration-200 whitespace-nowrap ${
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
          <div className="space-y-6">
            {/* Search & Filter Section */}
            <Card variant="elevated" className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Books List */}
            {loading ? (
              <Loader />
            ) : books.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No books found"
                description="Start by adding books to your library collection"
                action={
                  <Button 
                    variant="primary" 
                    onClick={() => setActiveTab("add")}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Book
                  </Button>
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {books.map((book) => (
                    <div key={book.book_id || book.book_code || book.id} className="p-0">
                      <div className="relative">
                        <div className="absolute right-2 top-2 flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedBook(book);
                              setShowEdit(true);
                            }}
                            className="p-1 bg-white rounded-md shadow text-blue-600 hover:bg-blue-50"
                            title="Edit book"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(book.book_code)}
                            className="p-1 bg-white rounded-md shadow text-red-600 hover:bg-red-50"
                            title="Delete book"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <BookCard book={book} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.previous}
                    onClick={() => loadBooks({ page: pagination.page - 1 })}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.next}
                    onClick={() => loadBooks({ page: pagination.page + 1 })}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "add" && (
          <Card variant="elevated" className="p-6">
            {showAdd ? (
              <AddBook
                onClose={() => setShowAdd(false)}
                onAdded={() => {
                  loadBooks({ page: 1 });
                  setShowAdd(false);
                }}
              />
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-6">Add a new book to your library</p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowAdd(true)}
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add New Book
                </Button>
              </div>
            )}
          </Card>
        )}

        {activeTab === "bulk" && (
          <Card variant="elevated" className="p-6">
            <BulkUploadManager onUploaded={() => loadBooks({ page: 1 })} />
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
              loadBooks({ page: pagination.page });
            }}
          />
        )}
      </div>
    </div>
  );
}
