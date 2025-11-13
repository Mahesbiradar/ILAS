import React, { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";
import BookCard from "../components/library/BookCard";
import BookFilter from "../components/library/BookFilter";
import Loader from "../components/common/Loader";
import { getPublicBooks, getLibraryMeta } from "../api/libraryApi";
import { usePagination } from "../hooks/usePagination";

export default function Books() {
  const { user } = useAuth();
  const pagination = usePagination(50);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [manualSearch, setManualSearch] = useState("");
  const debounceRef = useRef(null);

  const loadCategories = useCallback(async () => {
    try {
      const meta = await getLibraryMeta();
      setCategories(meta.categories || meta.categories_list || []);
    } catch (err) {
      console.warn("Failed to load categories:", err.message);
    }
  }, []);

  const loadBooks = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const page = opts.page || pagination.page;
        const q = opts.q !== undefined ? opts.q : search;
        const cat = opts.category !== undefined ? opts.category : category;

        const data = await getPublicBooks({ page, page_size: pagination.pageSize, q: q.trim(), category: cat });
        setBooks(data.results || []);
        pagination.setPaginationData({ count: data.count || 0, next: data.next, previous: data.previous });
      } catch (err) {
        console.error("Failed to load catalog:", err);
        toast.error("Failed to load books.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination, search, category]
  );

  // initial load
  useEffect(() => {
    loadCategories();
    loadBooks({ page: 1 });
  }, []);

  // debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pagination.setPage(1);
      loadBooks({ page: 1, q: search });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // category change
  useEffect(() => {
    pagination.setPage(1);
    loadBooks({ page: 1, category });
  }, [category]);

  // page change (pagination controls will call pagination.setPage)
  useEffect(() => {
    loadBooks({ page: pagination.page });
  }, [pagination.page]);

  const handleSearchClick = () => {
    pagination.setPage(1);
    setSearch(manualSearch);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-2">
      <h1 className="text-xl font-semibold mb-3">📚 Library Catalog</h1>

      {/* Search & Filter Section */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={manualSearch}
            onChange={(e) => setManualSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            placeholder="Search by title, author, ISBN..."
            className="flex-1 h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
          <button
            onClick={handleSearchClick}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Search
          </button>
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            pagination.setPage(1);
            loadBooks({ page: 1, category: e.target.value });
          }}
          className="h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => {
            const name = c.name || c.title || c;
            const id = c.slug || c.id || c.name;
            return (
              <option key={id} value={id}>
                {name}
              </option>
            );
          })}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
          {books.map((book) => (
            <div key={book.book_id || book.id || book.book_code} className="flex justify-center">
              <BookCard book={book} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No books found.</p>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6 p-3 bg-white rounded-lg shadow-sm">
        <div className="text-xs sm:text-sm text-gray-600">Showing {books.length} of {pagination.count} books</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => pagination.goToPreviousPage()}
            disabled={pagination.page === 1}
            className="px-2 sm:px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
          >
            ← Prev
          </button>
          <div className="text-xs sm:text-sm font-medium">Page {pagination.page}</div>
          <button
            onClick={() => pagination.goToNextPage()}
            disabled={pagination.page >= pagination.totalPages}
            className="px-2 sm:px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
