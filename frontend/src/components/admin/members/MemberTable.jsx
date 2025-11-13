// src/components/admin/members/MemberTable.jsx
import React from "react";

export default function MemberTable({ members, onEdit, onDelete, onPromote }) {
  if (!members?.length)
    return (
      <p className="text-center text-gray-500 py-6">
        No members found. Add some to get started!
      </p>
    );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
        <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-600">
          <tr>
            <th className="p-3">Username</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">USN</th>
            <th className="p-3">Phone</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium text-gray-800">{member.username}</td>
              <td className="p-3 text-gray-600">{member.email}</td>
              <td className="p-3 text-gray-700 capitalize">{member.role}</td>
              <td className="p-3 text-gray-700">{member.usn}</td>
              <td className="p-3 text-gray-700">{member.phone}</td>
              <td className="p-3 text-center space-x-2">
                <button
                  onClick={() => onEdit(member)} // ✅ ensure full object passed
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
