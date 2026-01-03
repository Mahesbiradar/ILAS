// src/api/libraryApi.js
// Cleaned and aligned with backend URLs defined in library/urls.py
// Uses axios instance from ./axios.js which points at /api/ base and handles auth/refresh. :contentReference[oaicite:9]{index=9}
import api from "./axios";

const LIBRARY = "v1/library";
const PUBLIC = "v1/public";
const ADMIN = "v1/admin";

/* ------------------------------
  Books (library) - public & admin
   - List & filters (paginated)
   - Detail (pk)
   - Create / Update / Delete
   - Bulk upload
-------------------------------*/
export async function getBooks(filters = {}) {
  const res = await api.get(`${LIBRARY}/books/`, { params: filters });
  const data = res.data;
  // Backend returns paginated response: { success, data OR results, count, next, previous }
  // Normalize to { results, count, next, previous }
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  // If wrapper format { success, data } then try to pick data.results
  const payload = data.data ?? data;
  return {
    results: payload.results ?? payload.results ?? [],
    count: payload.count ?? payload.length ?? 0,
    next: payload.next ?? null,
    previous: payload.previous ?? null,
  };
}

export async function getPublicBooks(filters = {}) {
  const res = await api.get(`${PUBLIC}/books/`, { params: filters });
  const data = res.data;
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }
  const payload = data.data ?? data;
  return {
    results: payload.results ?? [],
    count: payload.count ?? 0,
    next: payload.next ?? null,
    previous: payload.previous ?? null,
  };
}

export async function getLibraryMeta() {
  const res = await api.get(`${PUBLIC}/meta/`);
  return res.data.categories || res.data;
}


export async function lookupBookByCode(bookCode) {
  // Public barcode lookup: /api/v1/public/lookup/<book_code>/
  const res = await api.get(`${PUBLIC}/lookup/${encodeURIComponent(bookCode)}/`);
  return res.data;
}

export async function getBookDetails(bookId) {
  const res = await api.get(`${LIBRARY}/books/${bookId}/`);
  return res.data;
}

export async function addBook(formData, onUploadProgress) {
  const res = await api.post(`${LIBRARY}/books/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress && { onUploadProgress }),
  });
  return res.data;
}

export async function editBook(bookId, formData) {
  // prefer PATCH; fallback to PUT handled in callers if needed
  const res = await api.patch(`${LIBRARY}/books/${bookId}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteBook(bookId) {
  const res = await api.delete(`${LIBRARY}/books/${bookId}/`);
  return res.data;
}

export async function bulkUploadBooks(formData, onUploadProgress) {
  // backend endpoint: /api/v1/library/books/bulk-upload/
  const res = await api.post(`${LIBRARY}/books/bulk-upload/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 600000, // 10 minutes for large ZIP uploads
    ...(onUploadProgress && { onUploadProgress }),
  });
  return res.data;
}

/* ------------------------------
  Admin AJAX helpers (quick search)
-------------------------------*/
export async function adminBookSearch(q, params = {}) {
  const res = await api.get(`${ADMIN}/ajax/book-search/`, { params: { q, ...params } });
  return res.data;
}

export async function adminUserSearch(q, params = {}) {
  const res = await api.get(`${ADMIN}/ajax/user-search/`, { params: { q, ...params } });
  return res.data;
}

/* ------------------------------
  Transactions & Admin endpoints
  (Transaction endpoints are in admin URL group)
-------------------------------*/
export async function issueBook(payload) {
  // POST /api/v1/admin/transactions/issue/
  const res = await api.post(`${ADMIN}/transactions/issue/`, payload);
  return res.data;
}

export async function returnBook(payload) {
  // POST /api/v1/admin/transactions/return/
  const res = await api.post(`${ADMIN}/transactions/return/`, payload);
  return res.data;
}

export async function updateBookStatus(payload) {
  // POST /api/v1/admin/transactions/status/
  const res = await api.post(`${ADMIN}/transactions/status/`, payload);
  return res.data;
}

export async function getActiveTransactions(params = {}) {
  const res = await api.get(`${ADMIN}/transactions/active/`, { params });
  return res.data;
}

/* ------------------------------
  Reports (admin)
-------------------------------*/
export async function getActiveIssues(params = {}) {
  const res = await api.get(`${ADMIN}/reports/active-issues/`, { params });
  return res.data;
}

export async function getOverdue(params = {}) {
  const res = await api.get(`${ADMIN}/reports/overdue/`, { params });
  return res.data;
}

export async function getMemberHistory(memberId, params = {}) {
  const res = await api.get(`${ADMIN}/reports/member/${memberId}/history/`, { params });
  return res.data;
}

export async function downloadMasterReport(params = {}) {
  const res = await api.get(`${ADMIN}/reports/master/`, { params, responseType: "blob" });
  return res;
}

export async function downloadInventoryReport(params = {}) {
  const res = await api.get(`${ADMIN}/reports/inventory/`, { params, responseType: "blob" });
  return res;
}

export async function downloadTransactionsReport(params = {}) {
  const res = await api.get(`${ADMIN}/reports/transactions/`, { params, responseType: "blob" });
  return res;
}

/* ------------------------------
  Dashboard
-------------------------------*/
export async function getDashboardStats() {
  const res = await api.get(`${ADMIN}/dashboard/stats/`);
  return res.data;
}

/* ------------------------------
  Task status (Celery task status endpoint)
  - endpoint mounted at: /api/tasks/status/<task_id>/  (see project root urls)
-------------------------------*/
export async function getTaskStatus(taskId) {
  const res = await api.get(`tasks/status/${encodeURIComponent(taskId)}/`);
  return res.data;
}


/* ------------------------------
  Barcode Generator (Admin)
-------------------------------*/
export async function generateBarcodesPDF(rawText, pageSize = "A4") {
  const res = await api.post(
    "v1/library/barcodes/generate/",
    {
      data: rawText,
      page_size: pageSize, // ✅ NEW (A4 / A3)
    },
    {
      responseType: "blob", // VERY IMPORTANT
    }
  );
  return res;
}


/* ------------------------------
  Admin – Book Excel Exports
-------------------------------*/

// 📘 Book Master Export (with filters & field selection)
export async function exportBookMaster(params = {}) {
  return api.get(
    "v1/admin/books/export/",
    {
      params,
      responseType: "blob", // important for Excel
    }
  );
}

// 📜 Book Audit Logs Export
export async function exportBookLogs(params = {}) {
  return api.get(
    "v1/admin/books/logs/export/",
    {
      params,
      responseType: "blob",
    }
  );
}
