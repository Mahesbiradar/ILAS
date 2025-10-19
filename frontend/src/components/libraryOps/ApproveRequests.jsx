// src/components/libraryOps/ApproveRequests.jsx
import React from "react";

export default function ApproveRequests() {
  const mockRequests = [
    { id: 1, user: "Mahesh", book: "Embedded Systems", status: "Pending" },
    { id: 2, user: "Ravi", book: "Networking Basics", status: "Approved" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100 mt-8">
      <h2 className="text-lg font-semibold text-green-700 mb-4">
        🟩 Borrow Requests
      </h2>
      <table className="w-full border-collapse">
        <thead className="bg-green-100 text-green-800">
          <tr>
            <th className="p-3 border">User</th>
            <th className="p-3 border">Book</th>
            <th className="p-3 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {mockRequests.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="p-3 border">{r.user}</td>
              <td className="p-3 border">{r.book}</td>
              <td className="p-3 border text-center">
                <span
                  className={`px-2 py-1 rounded text-sm ${
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
