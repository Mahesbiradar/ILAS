// src/components/admin/transactions/TransactionCard.jsx
import React from "react";
import { BookOpen, CheckCircle, Clock, AlertCircle, User } from "lucide-react";

/**
 * Lightweight transaction card used for Active tab or list views.
 * Now shows member_unique_id, actor_name, and action_date when available.
 */

export default function TransactionCard({ transaction }) {
  const txn = (transaction.txn_type || "").toUpperCase();
  const action = txn === "RETURN" ? "returned" : txn === "ISSUE" ? "borrowed" : txn.toLowerCase();

  const getActionStyle = (action) => {
    switch (action) {
      case "borrowed":
        return { color: "text-blue-700", bg: "bg-blue-50", icon: <BookOpen className="w-4 h-4 text-blue-600" /> };
      case "returned":
        return { color: "text-green-700", bg: "bg-green-50", icon: <CheckCircle className="w-4 h-4 text-green-600" /> };
      default:
        return { color: "text-gray-600", bg: "bg-gray-50", icon: <Clock className="w-4 h-4 text-gray-500" /> };
    }
  };

  const style = getActionStyle(action);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-4 flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
      <div className="flex items-center gap-3 w-full md:w-3/4">
        <div className={`p-2 rounded-full ${style.bg} flex items-center justify-center`}>
          {style.icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">
            {transaction.bookTitle} <span className="text-xs text-gray-400">({transaction.book_code})</span>
          </h3>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-3">
            <span className={`px-2 py-[2px] rounded-md text-xs font-medium ${style.bg} ${style.color}`}>
              {action.charAt(0).toUpperCase() + action.slice(1)}
            </span>
            {transaction.member_name && (
              <span className="text-gray-500 truncate flex items-center gap-2">
                <User className="w-3 h-3 text-gray-400" /> {transaction.member_name}
                <span className="text-xs text-gray-400 ml-2">({transaction.member_unique_id || "—"})</span>
              </span>
            )}
            {transaction.remarks && (
              <span className="text-gray-300">| {transaction.remarks}</span>
            )}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Action Date: {transaction.action_date ? new Date(transaction.action_date).toLocaleString() : "-"}
            {transaction.actor_name ? ` • Performed by: ${transaction.actor_name}` : ""}
          </p>
        </div>
      </div>

      <div className="text-right mt-3 md:mt-0 w-full md:w-1/4">
        <div className="text-sm text-gray-600">
          <div>Issued: {transaction.issue_date ? new Date(transaction.issue_date).toLocaleDateString() : "-"}</div>
          <div>Due: {transaction.due_date ? new Date(transaction.due_date).toLocaleDateString() : "-"}</div>
        </div>
        <div className="mt-2">
          {transaction.days_overdue > 0 ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-semibold">
              <AlertCircle className="w-4 h-4" /> {transaction.days_overdue} days overdue
            </div>
          ) : (
            <div className="text-sm text-gray-500">Fine: {transaction.fine_estimate ?? "0.00"}</div>
          )}
        </div>
      </div>
    </div>
  );
}
