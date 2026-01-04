import React, { useEffect } from "react";

export default function MemberLogs({ logs = [], onRefresh }) {
  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(onRefresh, 10000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const badgeClass = (action) => {
    const map = {
      added: "bg-green-100 text-green-700",
      edited: "bg-yellow-100 text-yellow-700",
      deleted: "bg-red-100 text-red-700",
      promoted: "bg-purple-100 text-purple-700",
    };
    return map[action] || "bg-gray-100 text-gray-700";
  };

  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      : "-";

  return (
    <div className="w-full">
      {/* ---------- DESKTOP TABLE (md:block) ---------- */}
      <div className="hidden md:block bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-[1000px]">
          <table className="w-full table-auto text-xs">
            <thead className="bg-gray-50 text-gray-600 border-b">
              <tr>
                <th className="px-2 py-2 min-w-[90px] text-left">Action</th>
                <th className="px-2 py-2 min-w-[140px] text-left">Username</th>
                <th className="px-2 py-2 min-w-[220px] text-left">Email</th>
                <th className="px-2 py-2 min-w-[100px] text-left">Role</th>
                <th className="px-2 py-2 min-w-[140px] text-left">Performed By</th>
                <th className="px-2 py-2 min-w-[170px] text-left">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {logs.length ? (
                logs.map((log, idx) => (
                  <tr
                    key={idx}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-2 py-1">
                      <span
                        className={`px-2 py-[2px] rounded-full text-[10px] font-medium ${badgeClass(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-2 py-1 truncate">
                      {log.username || "-"}
                    </td>

                    <td className="px-2 py-1 truncate">
                      {log.email || "-"}
                    </td>

                    <td className="px-2 py-1 capitalize">
                      {log.role || "-"}
                    </td>

                    <td className="px-2 py-1 truncate">
                      {log.performed_by || "-"}
                    </td>

                    <td className="px-2 py-1 text-gray-500">
                      {formatTime(log.timestamp)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No activity logs available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- MOBILE CARDS (md:hidden) ---------- */}
      <div className="md:hidden space-y-3">
        {logs.length ? (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-2"
            >
              {/* Header: Action + Time */}
              <div className="flex justify-between items-center">
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${badgeClass(
                    log.action
                  )}`}
                >
                  {log.action}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatTime(log.timestamp)}
                </span>
              </div>

              {/* Body: User info */}
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">
                    {log.username || "Unknown"}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {log.role || "-"}
                  </span>
                </div>
                <div className="text-gray-500 text-xs truncate">
                  {log.email}
                </div>
              </div>

              {/* Footer: Performed by */}
              <div className="text-xs text-gray-500 border-t border-gray-100 pt-2 mt-1 flex justify-between">
                <span>Performed by:</span>
                <span className="font-medium text-gray-700">
                  {log.performed_by || "System"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
            No activity logs found.
          </div>
        )}
      </div>
    </div>
  );
}
