// src/components/dashboard/ActivityFeed.jsx
import React from "react";

export default function ActivityFeed() {
  const activities = [
    { id: 1, user: "Mahesh", action: "Added book 'Radar Engineering'", date: "Oct 19, 2025" },
    { id: 2, user: "Ravi", action: "Approved borrow request for 'IoT Systems'", date: "Oct 18, 2025" },
    { id: 3, user: "Admin", action: "Edited 'Digital Communications'", date: "Oct 17, 2025" },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-blue-700 mb-4">🕒 Recent Activity</h2>
      <ul className="divide-y divide-gray-200">
        {activities.map((a) => (
          <li key={a.id} className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2">
            <span className="text-gray-700 text-sm">{a.action}</span>
            <span className="text-gray-400 text-xs">{a.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
