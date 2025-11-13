// src/services/announcementApi.js
import api from "../api/axios";

const PUBLIC = "v1/public";
const ADMIN = "v1/admin";

/**
 * Get all active announcements (public endpoint)
 * GET /api/v1/public/announcements/
 * Returns: [ { id, title, body, is_active, created_at, ... } ]
 * NOTE: Backend endpoint not yet implemented; placeholder for future use
 */
export const getAnnouncements = async () => {
  try {
    const res = await api.get(`${PUBLIC}/announcements/`);
    return res.data;
  } catch (err) {
    console.warn("Announcements endpoint not available yet, returning empty:", err.message);
    return [];
  }
};

/**
 * Create announcement (admin only)
 * POST /api/v1/admin/announcements/
 * Body: { title, body, is_active? }
 * NOTE: Backend endpoint not yet implemented
 */
export const createAnnouncement = async (title, body, isActive = true) => {
  try {
    const res = await api.post(`${ADMIN}/announcements/`, {
      title,
      body,
      is_active: isActive,
    });
    return res.data;
  } catch (err) {
    console.error("Create announcement failed:", err);
    throw err;
  }
};

/**
 * Update announcement (admin only)
 * PATCH /api/v1/admin/announcements/<id>/
 * NOTE: Backend endpoint not yet implemented
 */
export const updateAnnouncement = async (id, title, body, isActive) => {
  try {
    const res = await api.patch(`${ADMIN}/announcements/${id}/`, {
      title,
      body,
      is_active: isActive,
    });
    return res.data;
  } catch (err) {
    console.error("Update announcement failed:", err);
    throw err;
  }
};

/**
 * Delete announcement (admin only)
 * DELETE /api/v1/admin/announcements/<id>/
 * NOTE: Backend endpoint not yet implemented
 */
export const deleteAnnouncement = async (id) => {
  try {
    const res = await api.delete(`${ADMIN}/announcements/${id}/`);
    return res.data;
  } catch (err) {
    console.error("Delete announcement failed:", err);
    throw err;
  }
};

/**
 * Activate/Deactivate announcement
 * PATCH /api/v1/admin/announcements/<id>/
 * Body: { is_active: true/false }
 * NOTE: Backend endpoint not yet implemented
 */
export const toggleAnnouncementActive = async (id, isActive) => {
  return updateAnnouncement(id, null, null, isActive);
};
