// src/components/transactions/AdminTransactionList.jsx
import React from "react";
import TransactionCard from "./TransactionCard";

export default function AdminTransactionList() {
  const mockTransactions = [
    { id: 1, user: "Mahesh", bookTitle: "Signal Processing", action: "borrowed", date: "Oct 19, 2025" },
    { id: 2, user: "Ravi", bookTitle: "IoT for Beginners", action: "returned", date: "Oct 18, 2025" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">📊 Regular Book Transactions</h2>
      {mockTransactions.length > 0 ? (
        mockTransactions.map((t) => <TransactionCard key={t.id} transaction={t} />)
      ) : (
        <p className="text-gray-500 text-center">No book transactions available.</p>
      )}
    </div>
  );
}
