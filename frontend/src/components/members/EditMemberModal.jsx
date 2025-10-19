// src/components/members/EditMemberModal.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function EditMemberModal({ member, onClose, onUpdate }) {
  const [form, setForm] = useState({ ...member });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    onUpdate(form);
    toast.success("Member updated successfully!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">✏️ Edit Member</h2>

        <div className="space-y-3">
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Username"
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Email"
          />
          <input
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Phone (optional)"
          />
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="user">User / Student</option>
            <option value="admin">Admin / Librarian</option>
          </select>
        </div>

        <div className="flex justify-end mt-5 gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
