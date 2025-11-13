// src/components/admin/members/AddMemberForm.jsx
import React, { useState } from "react";
import toast from "react-hot-toast";
import { createMember } from "../../../api/members";

export default function AddMemberForm({ onAdded }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    usn: "",
    role: "user",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const newMember = await createMember(form);
      toast.success("Member added successfully!");
      onAdded(newMember);
      setForm({
        username: "",
        email: "",
        phone: "",
        usn: "",
        role: "user",
        password: "",
      });
    } catch (err) {
      toast.error("Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-600">Name</label>
          <input
            name="username"
            placeholder="Name"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Phone</label>
          <input
            name="phone"
            placeholder="Phone"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">USN</label>
          <input
            name="usn"
            placeholder="USN"
            value={form.usn}
            onChange={handleChange}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-blue-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600">Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full p-2 border border-gray-200 rounded-lg focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border border-gray-200 rounded-lg p-2 focus:ring-blue-400"
        >
          <option value="user">User</option>
          <option value="librarian">Librarian</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}
