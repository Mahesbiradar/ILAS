import React, { useEffect, useState } from "react";
import { updateMember } from "../../../api/members";
import toast from "react-hot-toast";

export default function EditMemberModal({ member, onClose, onSave }) {
  const [form, setForm] = useState({});

  useEffect(() => {
    if (member) {
      setForm({
        id: member.id,
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        username: member.username || "",
        email: member.email || "",
        phone: member.phone || "",
        unique_id: member.unique_id || "",
        role: member.role || "student",
        department: member.department || "",
        year: member.year || "",
        designation: member.designation || "",
        is_active: member.is_active ?? true,
        is_verified: member.is_verified ?? false,
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateMember(form.id, form);
      toast.success("Member updated successfully");
      onSave(updated);
    } catch {
      toast.error("Failed to update member");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Edit Member Details</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className="border p-2 rounded"
            />
            <input
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className="border p-2 rounded"
            />
          </div>

          {/* Login Info */}
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
            className="border p-2 rounded w-full"
            required
          />

          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 rounded w-full"
            required
          />

          {/* IDs */}
          <div className="grid grid-cols-2 gap-3">
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone"
              className="border p-2 rounded"
            />
            <input
              name="unique_id"
              value={form.unique_id}
              onChange={handleChange}
              placeholder="USN / Employee ID"
              className="border p-2 rounded"
            />
          </div>

          {/* Academic */}
          <div className="grid grid-cols-2 gap-3">
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department"
              className="border p-2 rounded"
            />
            <input
              name="year"
              value={form.year}
              onChange={handleChange}
              placeholder="Year"
              className="border p-2 rounded"
            />
          </div>

          <input
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Designation"
            className="border p-2 rounded w-full"
          />

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="border p-2 rounded w-full"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher/Staff</option>
            <option value="user">User</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>

          {/* Flags */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              />
              Active
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_verified"
                checked={form.is_verified}
                onChange={handleChange}
              />
              Verified
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
