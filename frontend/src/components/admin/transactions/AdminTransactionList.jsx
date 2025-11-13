// src/components/admin/transactions/AdminTransactionList.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import TransactionCard from "./TransactionCard";
import Loader from "../../common/Loader";
import toast from "react-hot-toast";
import { Download, RefreshCcw } from "lucide-react";
import { getActiveTransactions } from "../../../services/transactionApi";

export default function AdminTransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20; // default page size per user preference
  const [totalCount, setTotalCount] = useState(0);
  const debounceRef = useRef(null);

  const fetchTransactions = useCallback(async (opts = {}) => {
    const p = opts.page ?? page;
    const s = opts.status ?? status;
    const q = opts.search ?? search;

    try {
      setLoading(true);
      const filters = { page: p, page_size: perPage };
      if (s && s !== "all") filters.status = s;
      if (q) filters.search = q;

      const data = await getActiveTransactions(filters);
      setTransactions(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Error loading transactions:", err);
      toast.error("Failed to load transactions.");
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  // Debounce search and trigger fetch when page/status/search change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchTransactions({ page, status, search }), 300);
    return () => clearTimeout(debounceRef.current);
  }, [page, status, search, fetchTransactions]);

  // When total count shrinks and current page is out-of-range, reset page
  useEffect(() => {
    setPage((p) => (p > Math.ceil(totalCount / perPage) ? 1 : p));
  }, [totalCount]);

  // CSV Export
  const exportCSV = () => {
    if (!transactions.length) return toast.error("No data to export!");
    const headers = ["User", "Book", "Status", "Request Date", "Issue Date", "Return Date"];
    const rows = transactions.map(t => [
      t.user?.username || "",
      t.book?.title || "",
      t.status || "",
      t.request_date || "",
      t.issue_date || "-",
      t.return_date || "-"
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "admin_transactions.csv";
    link.click();
  };

  // Pagination (server-driven)
  const paginated = transactions; // already a page from server
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / perPage));

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-lg font-semibold text-blue-700">📊 All Book Transactions</h2>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search book or user..."
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="returned">Returned</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={() => fetchTransactions({ page, status, search })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1"
          >
            <RefreshCcw size={16} /> Refresh
          </button>

          <button
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : paginated.length > 0 ? (
        <>
          {paginated.map((t) => (
            <TransactionCard
              key={t.id}
              transaction={{
                id: t.id,
                user: t.user?.username || "",
                bookTitle: t.book?.title || "",
                action: t.status === "approved"
                  ? "borrowed"
                  : t.status === "returned"
                  ? "returned"
                  : "requested",
                date: t.request_date ? new Date(t.request_date).toLocaleDateString() : "",
              }}
            />
          ))}

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-4 gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center">No transactions found.</p>
      )}
    </div>
  );
}
