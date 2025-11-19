// src/components/admin/libraryOps/MemberInfoCard.jsx
import React from "react";

/**
 * A clean, modern card to display selected member details.
 * UI-only — does NOT affect logic.
 *
 * Expected props:
 * - member: { id, full_name, username, unique_id, role, email, phone, borrow_count }
 */

export default function MemberInfoCard({ member }) {
  if (!member) return null;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-4 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-blue-700">Member Details</h2>
        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">
          {member.role || "N/A"}
        </span>
      </div>

      {/* Main Info */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <Field label="Full Name" value={member.full_name || member.username} />
        <Field label="Username" value={member.username} />
        <Field label="Unique ID (USN / Emp ID)" value={member.unique_id} />
        <Field label="Email" value={member.email} />
        <Field label="Phone" value={member.phone} />
        <Field label="Member ID" value={member.id} />
      </div>

      {/* Borrow Summary */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-sm">
        <span className="font-semibold text-gray-700">Borrowed Books: </span>
        <span className="text-blue-700 font-semibold">
          {member.borrow_count}
        </span>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium text-gray-800">{value || "—"}</div>
    </div>
  );
}
