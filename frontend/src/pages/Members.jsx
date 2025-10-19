import React, { useState } from "react";
import MemberTable from "../components/members/MemberTable";
import toast from "react-hot-toast";

export default function Members() {
  const [members, setMembers] = useState([
    {
      id: 1,
      username: "Mahesh",
      email: "mahesh@example.com",
      role: "admin",
      phone: "9876543210",
      usn: "1DA23ET402",
    },
    {
      id: 2,
      username: "Ravi",
      email: "ravi@college.com",
      role: "user",
      phone: "9123456780",
      usn: "1DA23ET401",
    },
  ]);

  const handleUpdate = (updated) =>
    setMembers((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );

  const handleDelete = (id) =>
    setMembers((prev) => prev.filter((m) => m.id !== id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
        🏛️ Members Management
      </h1>
      <MemberTable members={members} onUpdate={handleUpdate} onDelete={handleDelete} />
    </div>
  );
}
