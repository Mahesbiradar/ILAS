import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthProvider";
import toast from "react-hot-toast";

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get("auth/userlist/");
      setMembers(res.data);
    } catch (err) {
      console.error("Error fetching members:", err);
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await api.patch(`auth/user/${id}/`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      fetchMembers();
    } catch (err) {
      toast.error("Failed to update role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await api.delete(`auth/user/${id}/`);
      toast.success("Member removed successfully");
      fetchMembers();
    } catch (err) {
      toast.error("Failed to delete member");
    }
  };

  if (user?.role !== "admin")
    return (
      <p className="text-center text-gray-500 mt-10">
        ❌ Access Denied. Admins only.
      </p>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700">👥 Members Management</h1>
        <button
          onClick={fetchMembers}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading members...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm md:text-base">
            <thead className="bg-blue-100 text-blue-800">
              <tr>
                <th className="p-3 border">#</th>
                <th className="p-3 border">Username</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Role</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">USN</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length > 0 ? (
                members.map((m, index) => (
                  <tr
                    key={m.id}
                    className="hover:bg-gray-50 transition duration-150"
                  >
                    <td className="p-3 border text-center">{index + 1}</td>
                    <td className="p-3 border font-semibold">{m.username}</td>
                    <td className="p-3 border">{m.email}</td>
                    <td className="p-3 border text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          m.role === "admin"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="p-3 border">{m.phone || "-"}</td>
                    <td className="p-3 border">{m.usn || "-"}</td>
                    <td className="p-3 border text-center">
                      <button
                        onClick={() => handleRoleToggle(m.id, m.role)}
                        className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                      >
                        {m.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-500 py-4">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
