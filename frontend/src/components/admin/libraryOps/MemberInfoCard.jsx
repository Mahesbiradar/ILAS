// src/components/admin/libraryOps/MemberInfoCard.jsx
import React from "react";

/**
 * Member info card (compact).
 * Props:
 *  - member: { id, full_name, username, unique_id, role, email, phone, borrow_count }
 */

export default function MemberInfoCard({ member }) {
  if (!member) return null;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-blue-700">
          Member Details
        </h2>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">
          {member.role || "N/A"}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <Field label="Full name" value={member.full_name || member.username} />
        <Field label="Username" value={member.username} />
        <Field label="Unique ID" value={member.unique_id} />
        <Field label="Email" value={member.email} />
        <Field label="Phone" value={member.phone} />
        <Field label="Member ID" value={member.id} />
      </div>

      <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
        <span className="font-semibold">Borrowed: </span>
        <span className="text-blue-700 font-semibold">{member.borrow_count ?? 0}</span>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="font-medium text-gray-800 text-sm">{value || "—"}</div>
    </div>
  );
}
