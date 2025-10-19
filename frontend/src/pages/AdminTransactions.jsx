import React from "react";

export default function AdminBookActivity() {
  const dummyData = [
    { id: 1, action: "Added Book", title: "Embedded Systems", user: "Mahesh", date: "2025-10-19" },
    { id: 2, action: "Edited Book", title: "Digital Communication", user: "Librarian", date: "2025-10-18" },
    { id: 3, action: "Deleted Book", title: "Radar Engineering", user: "Admin", date: "2025-10-17" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
        🧾 Book Add/Edit/Delete Activity
      </h2>
      <table className="w-full border-collapse">
        <thead className="bg-blue-100 text-blue-800">
          <tr>
            <th className="p-3 border text-left">#</th>
            <th className="p-3 border text-left">Action</th>
            <th className="p-3 border text-left">Book Title</th>
            <th className="p-3 border text-left">Performed By</th>
            <th className="p-3 border text-left">Date</th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 transition">
              <td className="p-3 border">{row.id}</td>
              <td className="p-3 border text-blue-600 font-medium">{row.action}</td>
              <td className="p-3 border">{row.title}</td>
              <td className="p-3 border">{row.user}</td>
              <td className="p-3 border text-gray-500">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
