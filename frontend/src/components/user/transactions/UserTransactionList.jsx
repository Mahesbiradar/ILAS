// src/components/user/transactions/UserTransactionList.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import Loader from "../../common/Loader";
import { RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import { getUserTransactions } from "../../../api/userApi";

export default function UserTransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const perPage = 20;
  const debounceRef = useRef(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      const params = { page, page_size: perPage };
      if (status !== "all") params.txn_type = status;

      const data = await getUserTransactions(params);
      setTransactions(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchTransactions, 150);
    return () => clearTimeout(debounceRef.current);
  }, [status, page, fetchTransactions]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));

  // Badge colors
  const badgeClass = {
    ISSUE: "bg-blue-100 text-blue-700 border border-blue-300",
    RETURN: "bg-green-100 text-green-700 border border-green-300",
    LOST: "bg-red-100 text-red-700 border border-red-300",
    DAMAGED: "bg-yellow-100 text-yellow-700 border border-yellow-400",
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          📘 Borrow History
        </h2>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="ISSUE">Issued</option>
            <option value="RETURN">Returned</option>
            <option value="LOST">Lost</option>
            <option value="DAMAGED">Damaged</option>
          </select>

          <button
            onClick={fetchTransactions}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No transactions found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border border-gray-300 rounded-lg shadow-sm">
              <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                <tr>
                  <th className="py-2 px-3 text-left">Book</th>
                  <th className="py-2 px-3 text-left">Issued</th>
                  <th className="py-2 px-3 text-left">Returned</th>
                  <th className="py-2 px-3 text-left">Due</th>
                  <th className="py-2 px-3 text-left">Type</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="py-2 px-3 font-medium text-gray-800">
                      {t.book_title}
                    </td>

                    <td className="py-2 px-3 text-gray-700">
                      {t.issue_date ? new Date(t.issue_date).toLocaleDateString() : "—"}
                    </td>

                    <td className="py-2 px-3 text-gray-700">
                      {t.return_date ? new Date(t.return_date).toLocaleDateString() : "—"}
                    </td>

                    <td className="py-2 px-3 text-gray-700">
                      {t.due_date ? new Date(t.due_date).toLocaleDateString() : "—"}
                    </td>

                    <td className="py-2 px-3">
                      <span className={`px-2 py-[2px] rounded-md text-xs font-medium ${badgeClass[t.txn_type]}`}>
                        {t.txn_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-4 gap-3 text-sm">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded-md hover:bg-gray-100 disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-gray-600 text-xs">
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
      )}
    </div>
  );
}
