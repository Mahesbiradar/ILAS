// --- FINAL COMPACT VERSION (50% UI, ALL LOGIC PRESERVED) ---
import React, { useEffect, useState, useRef, useCallback } from "react";
import TransactionCard from "./TransactionCard";
import Loader from "../../common/Loader";
import toast from "react-hot-toast";
import { Download, RefreshCcw, ChevronDown, ChevronUp } from "lucide-react";
import {
  getActiveTransactions,
  getAllTransactions,
  downloadTransactionsReport,
} from "../../../services/transactionApi";

export default function AdminTransactionList() {
  const [tab, setTab] = useState("active");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 50;
  const [totalCount, setTotalCount] = useState(0);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [expandedRow, setExpandedRow] = useState(null);

  const debounceRef = useRef(null);

  const formatDate = (d) => {
    if (!d) return "-";
    try {
      return new Date(d).toLocaleDateString("en-GB");
    } catch {
      return String(d).slice(0, 10);
    }
  };

  const buildFilters = (opts = {}) => {
    const p = opts.page ?? page;
    const q = opts.search ?? search;
    const params = { page: p, page_size: perPage };
    if (q.trim()) params.search = q.trim();
    if (opts.startDate ?? startDate) params.start_date = opts.startDate ?? startDate;
    if (opts.endDate ?? endDate) params.end_date = opts.endDate ?? endDate;
    return params;
  };

  const fetchTransactions = useCallback(
    async (opts = {}) => {
      try {
        setLoading(true);
        const filters = buildFilters(opts);
        const data =
          tab === "active"
            ? await getActiveTransactions(filters)
            : await getAllTransactions(filters);

        const results = (data.results || []).map((t) => ({
          id: t.id,
          txn_type: t.txn_type,
          book_code: t.book_code,
          bookTitle: t.book_title,
          member_name: t.member_name,
          member_unique_id: t.member_unique_id,
          issue_date: t.issue_date,
          due_date: t.due_date,
          return_date: t.return_date,
          action_date: t.action_date,
          actor_name: t.actor_name,
          days_overdue: t.days_overdue ?? 0,
          fine_estimate: String(t.fine_amount ?? t.fine_estimate ?? "0.00"),
          remarks: t.remarks ?? "",
        }));

        setTransactions(results);
        setTotalCount(data.count || 0);
      } catch (err) {
        console.error("Error loading transactions:", err);
        toast.error("Failed to load transactions.");
      } finally {
        setLoading(false);
      }
    },
    [tab, page, startDate, endDate, search]
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchTransactions({ page: 1 });
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [search, tab]);

  useEffect(() => {
    fetchTransactions({ page });
  }, [page]);

  const formatDateForCsv = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return "";
    }
  };

  const exportCSV = async () => {
    try {
      if (tab === "active") {
        if (!transactions.length) return toast.error("No data to export!");
        const headers = [
          "Transaction ID",
          "Book Code",
          "Title",
          "Member Name",
          "Member ID",
          "Issue Date",
          "Due Date",
          "Days Overdue",
          "Fine (Estimated)",
          "Performed By",
          "Remarks",
        ];
        const rows = transactions.map((t) => [
          t.id,
          t.book_code,
          t.bookTitle,
          t.member_name,
          t.member_unique_id || "",
          formatDateForCsv(t.issue_date),
          formatDateForCsv(t.due_date),
          t.days_overdue,
          t.fine_estimate,
          t.actor_name || "",
          `"${(t.remarks || "").replace(/"/g, '""')}"`,
        ]);
        const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `active_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        if (search) params.search = search;

        const res = await downloadTransactionsReport(params);
        const url = window.URL.createObjectURL(res.data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      toast.error("CSV export failed.");
    }
  };

  const totalPages = Math.ceil(totalCount / perPage) || 1;
  const toggleExpand = (id) => setExpandedRow((prev) => (prev === id ? null : id));

  return (
    <div className="bg-white shadow-sm rounded-lg p-3 border border-gray-200 mb-4 scale-[0.90] mt-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTab("active");
              setPage(1);
            }}
            className={`px-2 py-1 rounded text-xs ${
              tab === "active" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Active
          </button>

          <button
            onClick={() => {
              setTab("all");
              setPage(1);
            }}
            className={`px-2 py-1 rounded text-xs ${
              tab === "all" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            History
          </button>

          <h2 className="text-sm font-semibold text-blue-700 ml-2">
            {tab === "active" ? "📌 Issued Books" : "🕘 All Transactions"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <input
            type="text"
            placeholder={
              tab === "active"
                ? "Search book/member…"
                : "Search member/book/type/ID…"
            }
            className="border rounded px-2 py-1 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {tab === "all" && (
            <>
              <input
                type="date"
                className="border rounded px-2 py-1 text-xs"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                type="date"
                className="border rounded px-2 py-1 text-xs"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}

          <button
            onClick={() => fetchTransactions({ page })}
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
          >
            <RefreshCcw size={12} /> Refresh
          </button>

          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
          >
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <Loader />
      ) : transactions.length === 0 ? (
        <p className="text-center text-xs text-gray-500">No transactions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            {tab === "active" ? (
              <>
                <thead className="bg-blue-50 text-blue-800 text-[11px]">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Member</th>
                    <th className="p-2 text-left">MID</th>
                    <th className="p-2 text-left">Issue</th>
                    <th className="p-2 text-left">Due</th>
                    <th className="p-2 text-left">Over</th>
                    <th className="p-2 text-left">Fine</th>
                    <th className="p-2 text-left">By</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, i) => (
                    <tr key={t.id} className="hover:bg-gray-50 border-b">
                      <td className="p-2">{(page - 1) * perPage + i + 1}</td>
                      <td className="p-2">{t.book_code}</td>
                      <td className="p-2">{t.bookTitle}</td>
                      <td className="p-2">{t.member_name}</td>
                      <td className="p-2">{t.member_unique_id}</td>
                      <td className="p-2">{formatDate(t.issue_date)}</td>
                      <td className="p-2">{formatDate(t.due_date)}</td>
                      <td className="p-2">{t.days_overdue}</td>
                      <td className="p-2">{t.fine_estimate}</td>
                      <td className="p-2">{t.actor_name}</td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead className="bg-blue-50 text-blue-800 text-[11px]">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Code</th>
                    <th className="p-2 text-left">Title</th>
                    <th className="p-2 text-left">Member</th>
                    <th className="p-2 text-left">MID</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">By</th>
                    <th className="p-2 text-left">Fine</th>
                    <th className="p-2 text-left">Remarks</th>
                    <th className="p-2 text-left">+</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <React.Fragment key={t.id}>
                      <tr className="hover:bg-gray-50 border-b">
                        <td className="p-2">{t.id}</td>
                        <td className="p-2 font-medium">{t.txn_type}</td>
                        <td className="p-2">{t.book_code}</td>
                        <td className="p-2">{t.bookTitle}</td>
                        <td className="p-2">{t.member_name}</td>
                        <td className="p-2">{t.member_unique_id}</td>
                        <td className="p-2">{formatDate(t.action_date)}</td>
                        <td className="p-2">{t.actor_name}</td>
                        <td className="p-2">{t.fine_estimate}</td>
                        <td className="p-2 truncate max-w-[150px]">{t.remarks || "-"}</td>
                        <td className="p-2">
                          <button
                            onClick={() => toggleExpand(t.id)}
                            className="text-blue-600"
                          >
                            {expandedRow === t.id ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expand */}
                      {expandedRow === t.id && (
                        <tr className="bg-gray-50 text-[11px]">
                          <td colSpan={11} className="p-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div>Issue: {formatDate(t.issue_date)}</div>
                              <div>Due: {formatDate(t.due_date)}</div>
                              <div>Return: {formatDate(t.return_date)}</div>
                              <div>Fine: {t.fine_estimate}</div>
                              <div className="col-span-4">
                                Remarks: {t.remarks || "-"}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-3 text-[11px]">
        <div>
          Showing {(page - 1) * perPage + 1} – {Math.min(page * perPage, totalCount)} /{" "}
          {totalCount}
        </div>

        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span>
            {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
