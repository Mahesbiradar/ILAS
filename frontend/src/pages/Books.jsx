// src/pages/Books.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import BookCard from "../components/library/BookCard";
import Loader from "../components/common/Loader";
import { getPublicBooks, getLibraryMeta } from "../api/libraryApi";
import { usePagination } from "../hooks/usePagination";

export default function Books() {
  const pagination = usePagination(40);
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [manualSearch, setManualSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef(null);

  /* ---------------------- Load Categories ---------------------- */
  const loadCategories = useCallback(async () => {
    try {
      const meta = await getLibraryMeta(); // NOW CORRECT
      setCategories(meta || []);
    } catch (err) {
      console.warn("Failed to load categories:", err);
    }
  }, []);

  /* ---------------------- Load Books ---------------------- */
  const loadBooks = useCallback(
    async (opts = {}) => {
      setLoading(true);
      try {
        const page = opts.page || pagination.page;
        const q = opts.q ?? search;
        const cat = opts.category ?? category;

        const data = await getPublicBooks({
          page,
          page_size: pagination.pageSize,
          q: q.trim(),
          category: cat,
        });

        setBooks(data.results ?? []);
        pagination.setPaginationData({
          count: data.count ?? 0,
          next: data.next,
          previous: data.previous,
        });
      } catch (err) {
        toast.error("Unable to load books.");
      } finally {
        setLoading(false);
      }
    },
    [pagination, search, category]
  );

  /* ---------------------- Effects ---------------------- */
  useEffect(() => {
    loadCategories();
    loadBooks({ page: 1 });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pagination.setPage(1);
      loadBooks({ page: 1, q: search });
    }, 300);
  }, [search]);

  useEffect(() => {
    pagination.setPage(1);
    loadBooks({ page: 1, category });
  }, [category]);

  useEffect(() => {
    loadBooks({ page: pagination.page });
  }, [pagination.page]);

  const handleSearchClick = () => {
    pagination.setPage(1);
    setSearch(manualSearch);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <h1 className="text-lg font-semibold mb-2">📚 Library Catalog</h1>

      {/* Search + Category */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={manualSearch}
            onChange={(e) => setManualSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
            placeholder="Search by title, author, ISBN..."
            className="flex-1 h-9 px-3 border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleSearchClick}
            className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Search
          </button>
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
          {books.map((book) => (
            <BookCard key={book.book_code} book={book} />
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-10">No books found.</p>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6 p-3 bg-white rounded-lg shadow-sm">
        <div className="text-xs text-gray-600">
          Showing {books.length} of {pagination.count}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => pagination.goToPreviousPage()}
            disabled={pagination.page === 1}
            className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
          >
            ← Prev
          </button>
          <div className="text-xs font-medium">
            Page {pagination.page}
          </div>
          <button
            onClick={() => pagination.goToNextPage()}
            disabled={pagination.page >= pagination.totalPages}
            className="px-2 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
