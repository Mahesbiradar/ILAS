// src/components/transactions/UserBorrowRequests.jsx
import React from "react";

export default function UserBorrowRequests() {
  const mockRequests = [
    { id: 1, book: "IoT for Beginners", status: "Pending" },
    { id: 2, book: "Digital Signal Processing", status: "Approved" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mb-6">
      <h2 className="text-lg font-semibold text-yellow-700 mb-4">📘 Borrow Requests</h2>
      <table className="w-full border-collapse">
        <thead className="bg-yellow-100 text-yellow-800">
          <tr>
            <th className="p-3 border">Book</th>
            <th className="p-3 border text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {mockRequests.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="p-3 border">{r.book}</td>
              <td className="p-3 border text-center">
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    r.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
