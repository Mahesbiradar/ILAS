// src/components/admin/members/EditMemberModal.jsx
import React, { useEffect, useState } from "react";
import { updateMember } from "../../../api/members";
import { XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function EditMemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({
    id: "",
    username: "",
    email: "",
    phone: "",
    usn: "",
    role: "",
  });

  useEffect(() => {
    if (member) {
      setForm({
        id: member.id || "",
        username: member.username || "",
        email: member.email || "",
        phone: member.phone || "",
        usn: member.usn || "",
        role: member.role || "user",
      });
    }
  }, [member]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id) {
      toast.error("Invalid member ID");
      return;
    }
    try {
      const updated = await updateMember(form.id, form);
      toast.success("Member updated successfully!");
      onSave(updated);
    } catch {
      toast.error("Failed to update member");
    }
  };

  const handlePromote = async () => {
    if (!form.id) {
      toast.error("Invalid member ID");
      return;
    }

    const nextRole =
      form.role === "user"
        ? "librarian"
        : form.role === "librarian"
        ? "admin"
        : "admin";

    const updated = { ...form, role: nextRole };
    try {
      const res = await updateMember(form.id, updated);
      toast.success(`${form.username} promoted to ${nextRole}`);
      onSave(res);
    } catch {
      toast.error("Promotion failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Member Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">USN</label>
              <input
                name="usn"
                value={form.usn}
                onChange={handleChange}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border p-2 rounded-lg"
            >
              <option value="user">User</option>
              <option value="librarian">Librarian</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={handlePromote}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
            >
              Promote
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
