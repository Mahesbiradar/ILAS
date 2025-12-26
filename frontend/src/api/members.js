// src/api/members.js
// Cleaned members API aligned with accounts/urls.py.
// Members endpoints are exposed under /api/auth/... per accounts.urls. :contentReference[oaicite:12]{index=12}
import api from "./axios";

/**
 * Fetch members (ViewSet registered as 'members' under /api/auth/)
 * Supports pagination, search, role filters.
 */
export async function fetchMembers(params = {}) {
  const res = await api.get(`auth/members/`, { params });
  return res.data;
}

/**
 * Create a new member (admin)
 */
export async function createMember(payload) {
  const res = await api.post(`auth/members/`, payload);
  return res.data;
}

/**
 * Update a member (PATCH)
 */
export async function updateMember(id, payload) {
  const res = await api.patch(`auth/members/${id}/`, payload);
  return res.data;
}

/**
 * Delete a member
 */
export async function deleteMember(id) {
  const res = await api.delete(`auth/members/${id}/`);
  return res.data;
}

/**
 * Promote a member (if backend supports it). accounts.urls shows
 * member-related custom endpoints such as export/logs; check MemberViewSet for promote.
 * If promote endpoint exists, it would be under: auth/members/{id}/promote/
 * We'll keep a safe wrapper that will fail gracefully if backend doesn't support it.
 */
export async function promoteMember(id) {
  try {
    const res = await api.post(`auth/members/${id}/promote/`);
    return res.data;
  } catch (err) {
    // If endpoint not available, surface an informative error
    throw new Error(err.response?.data?.detail || "Promote member endpoint not available");
  }
}

/**
 * Fetch member logs (custom view)
 * accounts.urls registers member_logs at auth/members/logs/
 */
export async function fetchMemberLogs(params = {}) {
  const res = await api.get(`auth/members/logs/`, { params });
  return res.data;
}

/**
 * Export member logs as CSV (if supported)
 */
export async function exportMemberLogs() {
  const res = await api.get("auth/members/export/", {
    responseType: "blob",
  });
  return res.data;   // ✅ FIX
}

/**
 * Export all members as CSV (if supported)
 */
export async function exportAllMembers() {
  const res = await api.get("auth/members/export/all/", {
    responseType: "blob",
  });
  return res.data;   // ✅ FIX
}

/**
 * Quick user search helper (also available under admin AJAX)
 * We also expose a convenience that will hit admin/ajax/user-search/ if needed.
 */
export async function quickUserSearch(q, params = {}) {
  // Prefer admin AJAX endpoint if available
  return api.get(`v1/admin/ajax/user-search/`, { params: { q, ...params } }).then(r => r.data);
}
