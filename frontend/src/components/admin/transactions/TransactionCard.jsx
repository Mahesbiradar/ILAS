// src/components/admin/transactions/TransactionCard.jsx
import React from "react";
import { BookOpen, CheckCircle, PlusCircle, Edit3, Trash2, Clock } from "lucide-react";

export default function TransactionCard({ transaction }) {
  const getActionStyle = (action) => {
    switch (action) {
      case "borrowed":
        return { color: "text-blue-700", bg: "bg-blue-50", icon: <BookOpen className="w-4 h-4 text-blue-600" /> };
      case "returned":
        return { color: "text-green-700", bg: "bg-green-50", icon: <CheckCircle className="w-4 h-4 text-green-600" /> };
      case "added":
        return { color: "text-purple-700", bg: "bg-purple-50", icon: <PlusCircle className="w-4 h-4 text-purple-600" /> };
      case "edited":
        return { color: "text-yellow-700", bg: "bg-yellow-50", icon: <Edit3 className="w-4 h-4 text-yellow-600" /> };
      case "deleted":
        return { color: "text-red-700", bg: "bg-red-50", icon: <Trash2 className="w-4 h-4 text-red-600" /> };
      default:
        return { color: "text-gray-600", bg: "bg-gray-50", icon: <Clock className="w-4 h-4 text-gray-500" /> };
    }
  };

  const style = getActionStyle(transaction.action);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all p-4 flex flex-col md:flex-row justify-between items-start md:items-center mb-3">
      {/* Left Section */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className={`p-2 rounded-full ${style.bg} flex items-center justify-center`}>
          {style.icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{transaction.bookTitle}</h3>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            <span className={`px-2 py-[2px] rounded-md text-xs font-medium ${style.bg} ${style.color}`}>
              {transaction.action.charAt(0).toUpperCase() + transaction.action.slice(1)}
            </span>
            {transaction.user && (
              <span className="text-gray-400">| 👤 {transaction.user}</span>
            )}
          </p>
        </div>
      </div>

      {/* Right Section */}
      <p className="text-gray-400 text-sm mt-2 md:mt-0">{transaction.date}</p>
    </div>
  );
}
