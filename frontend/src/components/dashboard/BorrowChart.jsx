// src/components/dashboard/BorrowChart.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Jan", borrows: 30, returns: 20 },
  { month: "Feb", borrows: 25, returns: 22 },
  { month: "Mar", borrows: 40, returns: 35 },
  { month: "Apr", borrows: 50, returns: 45 },
  { month: "May", borrows: 60, returns: 58 },
];

export default function BorrowChart() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 mb-8">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">📈 Borrow vs Return Trend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="borrows" fill="#3b82f6" name="Borrowed" />
          <Bar dataKey="returns" fill="#10b981" name="Returned" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
