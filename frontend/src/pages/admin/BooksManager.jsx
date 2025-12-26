// src/pages/admin/BooksManager.jsx
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { BookOpen, Plus, Upload, Barcode, Search } from "lucide-react";

import BookMasterExport from "../../components/admin/books/BookMasterExport";
import BookLogExport from "../../components/admin/books/BookLogExport";


import BookManagerTableCompact from "../../components/admin/books/BookManagerTableCompact";
import AddBook from "../../components/admin/books/AddBook";
import EditBook from "../../components/admin/books/EditBook";
import BulkUploadManager from "../../components/admin/books/BulkUploadManager";
import BarcodeGenerator from "../../components/admin/books/BarcodeGenerator";

import { getBooks, deleteBook, getLibraryMeta } from "../../api/libraryApi";

/* ---------------------------------------------------------
   BooksManager (Admin)
   Clean, compact, responsive, backend-ready
---------------------------------------------------------- */
export default function BooksManager() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("view");

  const [selectedBook, setSelectedBook] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalCount, setTotalCount] = useState(0);

  const debounceRef = useRef(null);

  /* -------------------------------------------
     Load Categories
  ------------------------------------------- */
  // useEffect(() => {
  // const loadMeta = async () => {
  //   try {
  //     const meta = await getLibraryMeta();
  //     // use backend categories exactly as provided
  //     setCategories(meta?.categories || []);
  //   } catch (err) {
  //     console.warn("Category load error:", err);
  //   }
  // };
  // loadMeta();
  // }, []);

  /* -------------------------------------------
     Load Books
  ------------------------------------------- */
  const loadBooks = async (pg = 1, s = "", cat = "", st = "") => {
    try {
      setLoading(true);

      const params = { page: pg, page_size: pageSize };

      if (s.trim() !== "") params.search = s.trim();
      if (cat) params.category = cat;
      if (st) params.status = st;

      const res = await getBooks(params);

      let list = [];
      let count = 0;

      if (res.success && res.data) {
        list = res.data;
        count = res.count || list.length;
      } else if (res.results) {
        list = res.results;
        count = res.count || 0;
      } else if (Array.isArray(res)) {
        list = res;
        count = res.length;
      }

      setBooks(list);
      setTotalCount(count);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load books.");
      setBooks([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(1);
  }, []);

  /* -------------------------------------------
     Search / Filter Debounce
  ------------------------------------------- */
  useEffect(() => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      loadBooks(1, search, category, status);
      setPage(1);
    }, 250);

    return () => clearTimeout(debounceRef.current);
  }, [search, category, status]);

  /* -------------------------------------------
     Delete
  ------------------------------------------- */
  const handleDelete = async (book) => {
    if (!book?.id) return toast.error("Invalid book ID");

    const confirmMsg = `⚠️ Delete "${book.title}" permanently?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteBook(book.id);
      toast.success("Book deleted.");
      loadBooks(page, search, category, status);
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  /* -------------------------------------------
     Reset
  ------------------------------------------- */
  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setPage(1);
    loadBooks(1);
  };

  /* -------------------------------------------
     Tabs
  ------------------------------------------- */
  const tabs = [
    { id: "view", label: "All Books", icon: BookOpen },
    { id: "add", label: "Add Book", icon: Plus },
    { id: "bulk", label: "Bulk Upload", icon: Upload },
    { id: "barcode", label: "Barcode Generator", icon: Barcode },
    { id: "exports", label: "Exports", icon: Upload },

  ];

  const totalPages = Math.ceil(totalCount / pageSize);

  /* -------------------------------------------
     UI
  ------------------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-4">
      <div className="max-w-6xl mx-auto">

        {/* Header with reduced spacing */}
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Books Manager</h1>
        </div>

        <hr className="border-gray-200 mb-4" />

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-3 bg-white rounded-md shadow-sm p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${activeTab === t.id
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* VIEW TAB */}
        {activeTab === "view" && (
          <div className="space-y-3">

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-3 flex flex-wrap gap-2 items-end">

              {/* Search with icon */}
              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search title, author, ISBN…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1.5 text-sm"
                />
              </div>

              {/* Category */}

              {/* <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-w-[140px] px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>

                {categories.map((cat, idx) => {
                  // support both string categories and object categories from backend
                  const display =
                    typeof cat === "string"
                      ? cat
                      : cat?.name || cat?.title || cat?.label || String(cat);
                  // Use the exact display string as the value we send to backend
                  const valueToSend = display;
                  return (
                    <option key={idx} value={valueToSend}>
                      {display}
                    </option>
                  );
                })}
              </select> */}


              {/* Status */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Any Status</option>
                <option value="AVAILABLE">Available</option>
                <option value="ISSUED">Issued</option>
                <option value="LOST">Lost</option>
                <option value="DAMAGED">Damaged</option>
                <option value="REMOVED">Removed</option>
              </select>

              {/* Reset */}
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Reset
              </button>
            </div>

            {/* Table */}
            <BookManagerTableCompact
              books={books}
              loading={loading}
              onEdit={(book) => {
                setSelectedBook(book);
                setShowEditModal(true);
              }}
              onDelete={handleDelete}
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              onPreviousPage={() => {
                if (page > 1) {
                  const p = page - 1;
                  setPage(p);
                  loadBooks(p, search, category, status);
                }
              }}
              onNextPage={() => {
                if (page < totalPages) {
                  const p = page + 1;
                  setPage(p);
                  loadBooks(p, search, category, status);
                }
              }}
            />
          </div>
        )}

        {/* ADD TAB */}
        {activeTab === "add" && (
          <div className="bg-white rounded-lg shadow p-4">
            <AddBook
              onClose={() => setActiveTab("view")}
              onAdded={() => {
                loadBooks(1);
                setActiveTab("view");
              }}
            />
          </div>
        )}

        {/* BULK TAB */}
        {activeTab === "bulk" && (
          <div className="bg-white rounded-lg shadow p-4">
            <BulkUploadManager
              onUploaded={() => {
                loadBooks(1);
                setActiveTab("view");
              }}
            />
          </div>
        )}

        {/* BARCODE TAB */}
        {activeTab === "barcode" && (
          <div className="bg-white rounded-lg shadow p-4">
            <BarcodeGenerator />
          </div>
        )}
        {/* EXPORTS TAB */}
        {activeTab === "exports" && (
          <div className="space-y-4">

            {/* Book Master Export */}
            <div className="bg-white rounded-lg shadow p-4">
              <BookMasterExport />
            </div>

            {/* Book Logs Export */}
            <div className="bg-white rounded-lg shadow p-4">
              <BookLogExport />
            </div>

          </div>
        )}


        {/* EDIT MODAL */}
        {showEditModal && selectedBook && (
          <EditBook
            book={selectedBook}
            onClose={() => setShowEditModal(false)}
            onSubmit={() => {
              setShowEditModal(false);
              loadBooks(page, search, category, status);
            }}
          />
        )}
      </div>
    </div>
  );
}
