// src/pages/AdminTransactions.jsx
import React, { useEffect, useState } from "react";
import { getBooks } from "../api/libraryApi";
import AdminBookActivity from "../components/transactions/AdminBookActivity";
import AdminTransactionList from "../components/transactions/AdminTransactionList";
import { BookOpen, Users, Clock } from "lucide-react";
import Loader from "../components/common/Loader";
import toast from "react-hot-toast";

export default function AdminTransactions() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeBorrowers: 0,
    pendingReturns: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const books = await getBooks();
      const logs = await getAllBorrowLogs();

      const totalBooks = books.length;
      const activeBorrowers = new Set(
        logs.filter((l) => l.status === "approved").map((l) => l.user.username)
      ).size;
      const pendingReturns = logs.filter((l) => l.status === "approved").length;

      setStats({ totalBooks, activeBorrowers, pendingReturns });
    } catch (err) {
      console.error("Error fetching admin transaction stats:", err);
      toast.error("Failed to load admin transaction stats.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const summaryData = [
    {
      id: 1,
      title: "Total Books",
      value: stats.totalBooks,
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50 border-blue-100",
    },
    {
      id: 2,
      title: "Active Borrowers",
      value: stats.activeBorrowers,
      icon: <Users className="w-6 h-6 text-green-600" />,
      color: "bg-green-50 border-green-100",
    },
    {
      id: 3,
      title: "Pending Returns",
      value: stats.pendingReturns,
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      color: "bg-yellow-50 border-yellow-100",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-1">
          📊 Library Transactions & Activities
        </h1>
        <p className="text-gray-500 text-[15px] leading-snug">
          Monitor all borrow requests, book updates, and member activity — in real time.
        </p>
        <div className="h-[2px] w-20 bg-blue-600 mx-auto mt-3 rounded-full opacity-80"></div>
      </div>

      {/* Live Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {summaryData.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border ${item.color} shadow-sm hover:shadow-md transition-all flex items-center justify-between`}
          >
            <div>
              <h3 className="text-gray-800 font-semibold text-lg">
                {item.title}
              </h3>
              <p className="text-2xl font-bold text-gray-700 mt-1">{item.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white shadow-sm">{item.icon}</div>
          </div>
        ))}
      </div>

      {/* Realtime Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AdminBookActivity /> {/* Fetches from live CRUD operations */}
        <AdminTransactionList /> {/* Fetches all borrow transactions */}
      </div>
    </div>
  );
}
