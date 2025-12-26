import React from "react";

export default function MemberTable({ members, onEdit, onDelete, onPromote }) {
  if (!members?.length) {
    return (
      <p className="text-center text-gray-500 py-6">
        No members found. Add some to get started!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed bg-white rounded-lg text-xs border border-gray-200">
        {/* ---------- HEADER ---------- */}
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-2 py-2 w-[140px] text-left">First Name</th>
            <th className="px-2 py-2 w-[120px] text-left">Username</th>
            <th className="px-2 py-2 w-[200px] text-left">Email</th>
            <th className="px-2 py-2 w-[120px] text-left">Phone</th>
            <th className="px-2 py-2 w-[130px] text-left">USN / ID</th>
            <th className="px-2 py-2 w-[90px] text-left">Role</th>
            <th className="px-2 py-2 w-[70px] text-left">Dept</th>
            <th className="px-2 py-2 w-[60px] text-left">Year</th>
            <th className="px-2 py-2 w-[90px] text-left">Status</th>
            <th className="px-2 py-2 w-[160px] text-center">Actions</th>
          </tr>
        </thead>

        {/* ---------- BODY ---------- */}
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-t border-gray-100 hover:bg-gray-50"
            >
              <td className="px-2 py-1 truncate">
                {member.first_name || "-"}
              </td>

              <td className="px-2 py-1 font-medium truncate">
                {member.username}
              </td>

              <td className="px-2 py-1 truncate">
                {member.email}
              </td>

              <td className="px-2 py-1 truncate">
                {member.phone || "-"}
              </td>

              <td className="px-2 py-1 truncate">
                {member.unique_id || "-"}
              </td>

              <td className="px-2 py-1 capitalize">
                {member.role}
              </td>

              <td className="px-2 py-1">
                {member.department || "-"}
              </td>

              <td className="px-2 py-1">
                {member.year || "-"}
              </td>

              <td className="px-2 py-1">
                <span
                  className={`px-2 py-[2px] rounded-full text-[10px] ${member.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {member.is_active ? "Active" : "Inactive"}
                </span>
              </td>

              <td className="px-2 py-1 text-center space-x-2 whitespace-nowrap">
                <button
                  onClick={() => onEdit(member)}
                  className="text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => onPromote(member)}
                  className="text-purple-600 hover:underline"
                >
                  Promote
                </button>
                <button
                  onClick={() => onDelete(member)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
