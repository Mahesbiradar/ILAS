// src/pages/admin/Transactions.jsx
import React from "react";
import AdminTransactionList from "../../components/admin/transactions/AdminTransactionList";

export default function Transactions() {
  return (
    <div className="px-4 pt-2 pb-0">

      {/* Compact heading with clean spacing */}
      <h1 className="text-lg font-semibold text-blue-700 text-center mb-3">
        Transactions — Active & History
      </h1>

      {/* Table starts cleanly below heading */}
      <div className="mt-0">
        <AdminTransactionList />
      </div>
    </div>
  );
}
