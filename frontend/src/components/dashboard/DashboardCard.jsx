// src/components/dashboard/DashboardCard.jsx
import React from "react";

export default function DashboardCard({ title, value, icon, color }) {
  return (
    <div
      className={`flex items-center justify-between bg-white shadow-md rounded-xl p-5 border-l-4 ${color} transition hover:shadow-lg`}
    >
      <div>
        <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className="text-3xl opacity-70">{icon}</div>
    </div>
  );
}
