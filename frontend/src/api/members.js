// src/api/members.js
import api from "./axios";

// ✅ Fetch all members (Admins, Librarians, Users)
export async function fetchMembers() {
  const res = await api.get("members/");
  return res.data;
}

// ✅ Create a new member
export async function createMember(payload) {
  const res = await api.post("members/", payload);
  return res.data;
}

// ✅ Update or promote an existing member
export async function updateMember(id, payload) {
  const res = await api.put(`members/${id}/`, payload);
  return res.data;
}

// ✅ Delete a member (only if logged out)
export async function deleteMember(id) {
  const res = await api.delete(`members/${id}/`);
  return res.data;
}

// ✅ Promote a member role (User → Librarian → Admin)
export async function promoteMember(id) {
  const res = await api.post(`members/${id}/promote/`);
  return res.data;
}

// ✅ Fetch member activity logs
export async function fetchMemberLogs() {
  const res = await api.get("members/logs/");
  return res.data;
}

// ✅ Export logs as CSV
export async function exportMemberLogs() {
  const res = await api.get("members/export/?type=csv", {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "member_logs.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
