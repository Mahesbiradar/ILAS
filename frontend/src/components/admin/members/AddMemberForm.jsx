import React, { useState } from "react";
import toast from "react-hot-toast";
import { createMember } from "../../../api/members";

export default function AddMemberForm({ onAdded }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    unique_id: "",
    department: "",
    year: "",
    designation: "",
    role: "student",
    password: "",
    is_active: true,
    is_verified: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.password || form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const newMember = await createMember(form);
      toast.success("Member added successfully");
      onAdded(newMember);

      setForm({
        first_name: "",
        username: "",
        email: "",
        phone: "",
        unique_id: "",
        department: "",
        year: "",
        designation: "",
        role: "student",
        password: "",
        is_active: true,
        is_verified: false,
      });
    } catch (err) {
      toast.error("Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="first_name"
          placeholder="First Name"
          value={form.first_name}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      {/* Login */}
      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded-lg"
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded-lg"
      />

      {/* Contact + ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />
        <input
          name="unique_id"
          placeholder="USN / Employee ID"
          value={form.unique_id}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      {/* Academic / Org */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />
        <input
          name="year"
          placeholder="Year"
          value={form.year}
          onChange={handleChange}
          className="w-full p-2 border rounded-lg"
        />
      </div>

      <input
        name="designation"
        placeholder="Designation"
        value={form.designation}
        onChange={handleChange}
        className="w-full p-2 border rounded-lg"
      />

      {/* Password */}
      <input
        type="password"
        name="password"
        placeholder="Password (min 6 characters)"
        value={form.password}
        onChange={handleChange}
        required
        className="w-full p-2 border rounded-lg"
      />

      {/* Role */}
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        className="w-full p-2 border rounded-lg"
      >
        <option value="student">Student</option>
        <option value="teacher">Teacher/Staff</option>
        <option value="user">User</option>
        <option value="librarian">Librarian</option>
        <option value="admin">Admin</option>
      </select>

      {/* Flags */}
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          Active
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_verified"
            checked={form.is_verified}
            onChange={handleChange}
          />
          Verified
        </label>
      </div>

      {/* Action */}
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
