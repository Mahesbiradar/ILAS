// src/components/transactions/TransactionCard.jsx
import React from "react";

export default function TransactionCard({ transaction }) {
  return (
    <div className="border rounded-lg shadow-sm bg-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
      <div>
        <h3 className="font-semibold text-blue-700">{transaction.bookTitle}</h3>
        <p className="text-gray-600 text-sm">
          {transaction.user && <span>👤 {transaction.user} | </span>}
          {transaction.action === "borrowed" && "📘 Borrowed"}
          {transaction.action === "returned" && "✅ Returned"}
          {transaction.action === "added" && "➕ Added"}
          {transaction.action === "edited" && "✏️ Edited"}
          {transaction.action === "deleted" && "🗑️ Deleted"}
        </p>
      </div>
      <p className="text-gray-500 text-sm mt-2 md:mt-0">
        {transaction.date}
      </p>
    </div>
  );
}
