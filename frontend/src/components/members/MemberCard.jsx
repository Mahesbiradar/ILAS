// src/components/members/MemberCard.jsx
import React from "react";

export default function MemberCard({ member }) {
  return (
    <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all text-center">
      <h3 className="font-semibold text-gray-800">{member.username}</h3>
      <p className="text-sm text-gray-500">{member.email}</p>
      <p className="text-sm text-blue-600 font-medium mt-1 capitalize">
        {member.role}
      </p>
      <p className="text-xs text-gray-400 mt-1">USN: {member.usn}</p>
    </div>
  );
}
