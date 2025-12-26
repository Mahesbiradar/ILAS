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
    <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
      <table className="w-full table-fixed text-xs">
        <thead className="bg-gray-50 text-gray-600 border-b">
          <tr>
            <th className="px-2 py-2 w-[90px] text-left">Action</th>
            {/* <th className="px-2 py-2 w-[130px] text-left">Member ID</th> */}
            <th className="px-2 py-2 w-[140px] text-left">Username</th>
            <th className="px-2 py-2 w-[220px] text-left">Email</th>
            <th className="px-2 py-2 w-[100px] text-left">Role</th>
            <th className="px-2 py-2 w-[140px] text-left">Performed By</th>
            <th className="px-2 py-2 w-[170px] text-left">Timestamp</th>
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

                {/* <td className="px-2 py-1 truncate">
                  {log.member_id || "-"}
                </td> */}

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
                colSpan={7}
                className="px-4 py-6 text-center text-gray-500"
              >
                No activity logs available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
