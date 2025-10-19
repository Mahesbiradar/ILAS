// src/components/dashboard/UserDashboard.jsx
import React from "react";
import DashboardCard from "./DashboardCard";
import { BookOpen, Clock, CheckCircle } from "lucide-react";

export default function UserDashboard() {
  const stats = [
    { title: "Books Borrowed", value: 4, icon: <BookOpen />, color: "border-blue-500" },
    { title: "Pending Approvals", value: 2, icon: <Clock />, color: "border-yellow-500" },
    { title: "Returned Books", value: 10, icon: <CheckCircle />, color: "border-green-500" },
  ];

  const recent = [
    { title: "IoT for Beginners", status: "Pending" },
    { title: "Python for Engineers", status: "Approved" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">📊 User Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((s, i) => (
          <DashboardCard key={i} {...s} />
        ))}
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">Recent Requests</h2>
        <table className="w-full border-collapse">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="p-3 border">Book</th>
              <th className="p-3 border text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-3 border">{r.title}</td>
                <td className="p-3 border text-center">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      r.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
