// src/components/dashboard/AdminDashboard.jsx
import React from "react";
import DashboardCard from "./DashboardCard";
import BorrowChart from "./BorrowChart";
import ActivityFeed from "./ActivityFeed";
import { Users, BookOpen, ClipboardList } from "lucide-react";

export default function AdminDashboard() {
  const stats = [
    { title: "Total Books", value: 324, icon: <BookOpen />, color: "border-blue-500" },
    { title: "Active Users", value: 78, icon: <Users />, color: "border-green-500" },
    { title: "Pending Requests", value: 12, icon: <ClipboardList />, color: "border-yellow-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">🏛️ Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => (
          <DashboardCard key={i} {...s} />
        ))}
      </div>

      {/* Borrow Stats Chart */}
      <BorrowChart />

      {/* Activity Feed */}
      <ActivityFeed />
    </div>
  );
}
