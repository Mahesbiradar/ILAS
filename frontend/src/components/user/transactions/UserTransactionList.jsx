// src/components/user/transactions/UserTransactionList.jsx
import React, { useEffect, useState } from "react";
import Loader from "../../common/Loader";
import { RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function UserTransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // TODO: Update with actual API call from transactionApi
      // const data = await getBorrowHistory();
      setTransactions([]);
    } catch (err) {
      console.error("Error loading transactions:", err);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    status === "all" ? transactions : transactions.filter((t) => t.status === status);

  if (loading) return <Loader />;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-blue-700">
          📖 Borrow History
        </h2>

        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="approved">Borrowed</option>
            <option value="returned">Returned</option>
            <option value="pending">Pending</option>
          </select>

          <button
            onClick={fetchTransactions}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md flex items-center gap-1"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No transactions found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="py-2 px-3 text-left">Book</th>
                <th className="py-2 px-3 text-left">Issued</th>
                <th className="py-2 px-3 text-left">Returned</th>
                <th className="py-2 px-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b hover:bg-gray-50 transition-all"
                >
                  <td className="py-2 px-3 font-medium text-gray-800">{t.book.title}</td>
                  <td className="py-2 px-3 text-gray-600">
                    {t.issue_date ? new Date(t.issue_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {t.return_date ? new Date(t.return_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-[2px] rounded-md text-xs font-medium capitalize ${
                        t.status === "returned"
                          ? "bg-blue-50 text-blue-700"
                          : t.status === "approved"
                          ? "bg-green-50 text-green-700"
                          : t.status === "pending"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
