// src/pages/admin/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../../api/libraryApi";
import { getAllTransactions } from "../../services/transactionApi";
import Loader from "../../components/common/Loader";
import DashboardCard from "../../components/common/DashboardCard";
import { BookOpen, Users, Clock, AlertTriangle, List, FileText } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_books: 0,
    issued_count: 0,
    overdue_count: 0,
    total_unpaid_fines: "0.00",
  });

  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
    loadRecentTransactions();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const data = await getAllTransactions({ page_size: 10, page: 1 });
      setRecentTxns(data.results || []);
    } catch (err) {
      console.error("Recent transactions error:", err);
    }
  };

  if (loading) return <Loader />;

  const availableBooks = stats.total_books - stats.issued_count;

  return (
    <div className="max-w-7xl mx-auto px-4 py-3">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">
        🏛️ Library Admin Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total Books"
          value={stats.total_books}
          color="blue"
          icon={<BookOpen size={20} />}
          onClick={() => navigate("/admin/books")}
        />

        <DashboardCard
          title="Issued Books"
          value={stats.issued_count}
          color="green"
          icon={<Users size={20} />}
          onClick={() => navigate("/admin/transactions")}
        />

        <DashboardCard
          title="Available Books"
          value={availableBooks}
          color="purple"
          icon={<Clock size={20} />}
          onClick={() => navigate("/admin/books")}
        />

        <DashboardCard
          title="Overdue Books"
          value={stats.overdue_count}
          color="red"
          icon={<AlertTriangle size={20} />}
          onClick={() => navigate("/admin/transactions")}
        />
      </div>

      {/* SHORTCUTS */}
      <h2 className="text-lg font-semibold mb-2">Quick Shortcuts</h2>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
        <DashboardCard
          title="Books Manager"
          color="blue"
          icon={<BookOpen size={20} />}
          onClick={() => navigate("/admin/books")}
        />

        <DashboardCard
          title="Members"
          color="green"
          icon={<Users size={20} />}
          onClick={() => navigate("/admin/members")}
        />

        <DashboardCard
          title="Transactions"
          color="purple"
          icon={<List size={20} />}
          onClick={() => navigate("/admin/transactions")}
        />

        <DashboardCard
          title="Overdue"
          color="red"
          icon={<AlertTriangle size={20} />}
          onClick={() => navigate("/admin/Transactions")}
        />

        <DashboardCard
          title="Reports"
          color="blue"
          icon={<FileText size={20} />}
          onClick={() => navigate("/admin/reports")}
        />
      </div>

      {/* RECENT TRANSACTIONS */}
      <h2 className="text-lg font-semibold mb-2">Recent Transactions</h2>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3">Type</th>
                <th className="p-3">Book</th>
                <th className="p-3">Member</th>
                <th className="p-3">Date</th>
                <th className="p-3">By</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {recentTxns.map((tx, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition text-sm"
                >
                  <td className="p-3 font-medium">{tx.txn_type}</td>
                  <td className="p-3">{tx.book_title}</td>
                  <td className="p-3">{tx.member_name || "—"}</td>

                  {/* Clean date */}
                  <td className="p-3">
                    {tx.action_date ? tx.action_date.split("T")[0] : "—"}
                  </td>

                  <td className="p-3">{tx.performed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recentTxns.length === 0 && (
          <p className="text-center p-4 text-gray-500">No recent transactions</p>
        )}
      </div>

    </div>
  );
}
