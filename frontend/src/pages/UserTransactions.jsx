// src/pages/UserTransactions.jsx
import React, { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Clock, CheckCircle } from "lucide-react";
import Loader from "../components/common/Loader";
import UserTransactionList from "../components/transactions/UserTransactionList";
import toast from "react-hot-toast";

export default function UserTransactions() {
  const [stats, setStats] = useState({
    borrowed: 0,
    returned: 0,
    pending: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getBorrowHistory();
      const borrowed = data.filter((b) => b.status === "approved").length;
      const returned = data.filter((b) => b.status === "returned").length;
      const pending = data.filter((b) => b.status === "pending").length;
      setStats({ borrowed, returned, pending, total: data.length });
    } catch (err) {
      console.error("Error loading user transaction stats:", err);
      toast.error("Unable to load your transaction data.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const summaryData = [
    {
      id: 1,
      title: "Books Borrowed",
      count: stats.borrowed,
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50 border-blue-100",
    },
    {
      id: 2,
      title: "Books Returned",
      count: stats.returned,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      color: "bg-green-50 border-green-100",
    },
    {
      id: 3,
      title: "Pending Requests",
      count: stats.pending,
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      color: "bg-yellow-50 border-yellow-100",
    },
    {
      id: 4,
      title: "Total Transactions",
      count: stats.total,
      icon: <ClipboardList className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-50 border-purple-100",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">
          📘 My Library Transactions
        </h1>
        <p className="text-gray-500 text-[15px] leading-snug">
          Track your borrowed books, pending requests, and full borrow history.
        </p>
        <div className="h-[2px] w-16 bg-blue-500 mx-auto mt-3 rounded-full opacity-70"></div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {summaryData.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl shadow-sm border ${item.color} hover:shadow-md transition-all flex items-center justify-between`}
          >
            <div>
              <h3 className="text-gray-800 font-semibold text-lg">
                {item.title}
              </h3>
              <p className="text-2xl font-bold text-gray-700 mt-1">
                {item.count}
              </p>
            </div>
            <div className="p-3 rounded-full bg-white shadow-sm">{item.icon}</div>
          </div>
        ))}
      </div>

      {/* Requests & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserTransactionList />
      </div>
    </div>
  );
}
