// src/components/transactions/UserTransactionList.jsx
import React from "react";
import TransactionCard from "./TransactionCard";

export default function UserTransactionList() {
  const mockData = [
    { id: 1, bookTitle: "Embedded Systems", action: "borrowed", date: "Oct 17, 2025" },
    { id: 2, bookTitle: "Python for Engineers", action: "returned", date: "Oct 15, 2025" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">📗 Your Transactions</h2>
      {mockData.length > 0 ? (
        mockData.map((t) => <TransactionCard key={t.id} transaction={t} />)
      ) : (
        <p className="text-gray-500 text-center">No transactions found.</p>
      )}
    </div>
  );
}
