// src/components/transactions/AdminBookActivity.jsx
import React from "react";
import TransactionCard from "./TransactionCard";

export default function AdminBookActivity() {
  const mockActivity = [
    { id: 1, user: "Admin Mahesh", bookTitle: "VLSI Design", action: "added", date: "Oct 17, 2025" },
    { id: 2, user: "Admin Mahesh", bookTitle: "Digital Communication", action: "edited", date: "Oct 18, 2025" },
    { id: 3, user: "Admin Mahesh", bookTitle: "IoT for Beginners", action: "deleted", date: "Oct 19, 2025" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-red-700 mb-4">🧾 Book Management Activity</h2>
      {mockActivity.length > 0 ? (
        mockActivity.map((t) => <TransactionCard key={t.id} transaction={t} />)
      ) : (
        <p className="text-gray-500 text-center">No admin activities recorded.</p>
      )}
    </div>
  );
}
