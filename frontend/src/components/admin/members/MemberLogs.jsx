// src/components/admin/members/MemberLogs.jsx
import React, { useEffect } from "react";

export default function MemberLogs({ logs = [], onRefresh }) {
  // Auto-refresh logs every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (onRefresh) onRefresh();
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [onRefresh]);

  const getActionColor = (action) => {
    switch (action) {
      case "added":
        return "bg-green-100 text-green-700";
      case "edited":
        return "bg-yellow-100 text-yellow-700";
      case "deleted":
        return "bg-red-100 text-red-700";
      case "promoted":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-100 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 uppercase">
          <tr>
            <th className="p-3">Action</th>
            <th className="p-3">Member</th>
            <th className="p-3">Performed By</th>
            <th className="p-3">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <tr key={i} className="hover:bg-gray-50 border-t">
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </td>
                <td className="p-3">{log.member}</td>
                <td className="p-3">{log.performed_by}</td>
                <td className="p-3 text-gray-500">{formatTime(log.timestamp)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="p-4 text-center text-gray-500">
                No activity logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
