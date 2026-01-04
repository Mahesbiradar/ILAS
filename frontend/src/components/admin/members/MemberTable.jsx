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
    <div className="w-full">
      {/* ---------- DESKTOP TABLE (md:block) ---------- */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full table-fixed bg-white rounded-lg text-xs border border-gray-200">
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
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-1 truncate">{member.first_name || "-"}</td>
                <td className="px-2 py-1 font-medium truncate">{member.username}</td>
                <td className="px-2 py-1 truncate">{member.email}</td>
                <td className="px-2 py-1 truncate">{member.phone || "-"}</td>
                <td className="px-2 py-1 truncate">{member.unique_id || "-"}</td>
                <td className="px-2 py-1 capitalize">{member.role}</td>
                <td className="px-2 py-1">{member.department || "-"}</td>
                <td className="px-2 py-1">{member.year || "-"}</td>
                <td className="px-2 py-1">
                  <span className={`px-2 py-[2px] rounded-full text-[10px] ${member.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {member.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-2 py-1 text-center space-x-2 whitespace-nowrap">
                  <button onClick={() => onEdit(member)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => onPromote(member)} className="text-purple-600 hover:underline">Promote</button>
                  <button onClick={() => onDelete(member)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- MOBILE CARDS (md:hidden) ---------- */}
      <div className="md:hidden space-y-4">
        {members.map((member) => (
          <div key={member.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col space-y-3">
            {/* Card Header: Name + role/status */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{member.first_name || "Unknown"}</h3>
                <p className="text-xs text-gray-500">@{member.username}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${member.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {member.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Card Body: Details */}
            <div className="text-sm space-y-1 text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium w-16">Email:</span>
                <span className="truncate">{member.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-16">Role:</span>
                <span className="capitalize">{member.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium w-16">USN/ID:</span>
                <span>{member.unique_id || "-"}</span>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => onEdit(member)}
                className="w-full py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition"
              >
                Edit Details
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => onPromote(member)}
                  className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-md text-sm font-medium hover:bg-purple-100 transition"
                >
                  Promote
                </button>
                <button
                  onClick={() => onDelete(member)}
                  className="flex-1 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
