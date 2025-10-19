// src/components/members/MemberCard.jsx
import React from "react";

export default function MemberCard({ member }) {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition">
      <h3 className="font-semibold text-blue-700">{member.username}</h3>
      <p className="text-gray-600 text-sm">{member.email}</p>
      <p className="text-gray-500 text-sm">
        Role:{" "}
        <span
          className={`font-medium ${
            member.role === "admin" ? "text-purple-600" : "text-green-600"
          }`}
        >
          {member.role}
        </span>
      </p>
    </div>
  );
}
