import React from "react";
import UserTransactionList from "../components/transactions/UserTransactionList";
import UserBorrowRequests from "../components/transactions/UserBorrowRequests";

export default function UserTransactions() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        📘 Your Transactions
      </h1>
      <UserTransactionList />
      <UserBorrowRequests />
    </div>
  );
}
