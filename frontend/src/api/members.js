// src/api/members.js
import api from "./axios"; // ✅ your configured axios instance (includes baseURL + auth headers)

// ✅ Fetch all members (Admins, Librarians, Users)
export async function fetchMembers() {
  const res = await api.get("auth/members/");
  return res.data;
}

// ✅ Create a new member
export async function createMember(payload) {
  const res = await api.post("auth/members/", payload);
  return res.data;
}

// ✅ Update or promote an existing member
export async function updateMember(id, payload) {
  const res = await api.put(`auth/members/${id}/`, payload);
  return res.data;
}

// ✅ Delete a member (only if logged out)
export async function deleteMember(id) {
  const res = await api.delete(`auth/members/${id}/`);
  return res.data;
}

// ✅ Promote a member role (User → Librarian → Admin)
export async function promoteMember(id) {
  const res = await api.post(`auth/members/${id}/promote/`);
  return res.data;
}

// ✅ Fetch member activity logs
export async function fetchMemberLogs() {
  const res = await api.get("auth/members/logs/");
  return res.data;
}

// ✅ Export logs as CSV
export async function exportMemberLogs() {
  const res = await api.get("auth/members/export/?type=csv", {
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

// ✅ Export all members as CSV (🆕 Fixed Function)
export async function exportAllMembers() {
  const res = await api.get("auth/members/export/all/", {
    responseType: "blob",
  });

  const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "all_members.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
