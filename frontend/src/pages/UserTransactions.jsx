// src/pages/UserDashboard.jsx
import React from "react";
import { BookOpen, ClipboardList, Clock, CheckCircle } from "lucide-react";
import UserTransactionList from "../components/transactions/UserTransactionList";
import UserBorrowRequests from "../components/transactions/UserBorrowRequests";

export default function UserDashboard() {
  const summaryData = [
    {
      id: 1,
      title: "Books Borrowed",
      count: 4,
      icon: <BookOpen className="w-6 h-6 text-blue-600" />,
      color: "bg-blue-50 border-blue-100",
    },
    {
      id: 2,
      title: "Books Returned",
      count: 8,
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      color: "bg-green-50 border-green-100",
    },
    {
      id: 3,
      title: "Pending Requests",
      count: 2,
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
      color: "bg-yellow-50 border-yellow-100",
    },
    {
      id: 4,
      title: "Total Transactions",
      count: 12,
      icon: <ClipboardList className="w-6 h-6 text-purple-600" />,
      color: "bg-purple-50 border-purple-100",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">
          Welcome to Your <span className="text-blue-600">Dashboard</span>
        </h1>
        <p className="text-gray-500 text-[15px] leading-snug">
          View your recent library activity, requests, and book transactions at a glance.
        </p>
        <div className="h-[2px] w-16 bg-blue-500 mx-auto mt-3 rounded-full opacity-70"></div>
      </div>

      {/* Summary Cards */}
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
            <div className="p-3 rounded-full bg-white shadow-sm">
              {item.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction & Requests Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserTransactionList />
        <UserBorrowRequests />
      </div>
    </div>
  );
}
