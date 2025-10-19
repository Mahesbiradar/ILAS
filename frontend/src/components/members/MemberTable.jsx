// src/components/members/MemberTable.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import EditMemberModal from "./EditMemberModal";

export default function MemberTable({ members, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  const filtered = members.filter(
    (m) =>
      m.username.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-blue-700">👥 Member Management</h2>
        <input
          type="text"
          placeholder="🔍 Search by name or email"
          className="border rounded-md px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              <th className="p-3 border">Username</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Phone</th>
              <th className="p-3 border">USN</th>
              <th className="p-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="p-3 border font-medium">{m.username}</td>
                <td className="p-3 border">{m.email}</td>
                <td className="p-3 border text-center">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      m.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {m.role}
                  </span>
                </td>
                <td className="p-3 border">{m.phone || "—"}</td>
                <td className="p-3 border">{m.usn || "—"}</td>
                <td className="p-3 border text-center">
                  <button
                    onClick={() => setSelectedMember(m)}
                    className="text-yellow-600 hover:text-yellow-700 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this member?")) onDelete(m.id);
                      toast.success("Member deleted successfully");
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <EditMemberModal
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}
