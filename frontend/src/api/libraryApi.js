// src/api/libraryApi.js
import axios from "./axios"; // ✅ Uses Axios instance with JWT interceptors

// URL prefixes relative to `API_BASE` (API_BASE already points to `/api/`)
const LIBRARY = `v1/library`;
const PUBLIC = `v1/public`;
const ADMIN = `v1/admin`;

// ===============================================================
// 📚 BOOK CRUD OPERATIONS
// ===============================================================

// 🔹 Fetch all books with filters & pagination
export const getBooks = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${LIBRARY}/books/?${params}`);
  const data = res.data;

  // Normalize pagination to { results, count, next, previous }
  return Array.isArray(data)
    ? { results: data, count: data.length, next: null, previous: null }
    : {
        results: data.results || [],
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      };
};

// 🔹 Public books endpoint (catalog) with pagination/search/category
export const getPublicBooks = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`${PUBLIC}/books/?${params}`);
  const data = res.data;
  return Array.isArray(data)
    ? { results: data, count: data.length, next: null, previous: null }
    : {
        results: data.results || [],
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      };
};

// 🔹 Library metadata (categories, tags) used by catalog filters
export const getLibraryMeta = async () => {
  const res = await axios.get(`${LIBRARY}/meta/`);
  return res.data || {};
};

// 🔹 Get single book details (with nested copies)
export const getBookDetails = async (bookCode) => {
  const res = await axios.get(`${LIBRARY}/books/${bookCode}/`);
  return res.data;
};

// 🔹 Add a new book (with live upload progress)
export const addBook = async (bookData, onUploadProgress) => {
  const res = await axios.post(`${LIBRARY}/books/`, bookData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress && { onUploadProgress }),
  });
  return res.data;
};

// 🔹 Edit/Update a book (PATCH preferred, fallback to PUT)
export const editBook = async (bookCode, formData) => {
  try {
    const res = await axios.patch(`${LIBRARY}/books/${bookCode}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    if (err?.response?.status === 400 || err?.response?.status === 405) {
      const res = await axios.put(`${LIBRARY}/books/${bookCode}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    throw err;
  }
};

// 🔹 Delete a single book
export const deleteBook = async (bookCode) => {
  const res = await axios.delete(`${LIBRARY}/books/${bookCode}/`);
  return res.data;
};

// 🔹 Bulk delete books
export const bulkDeleteBooks = async (bookIds) => {
  const res = await axios.post(`${LIBRARY}/books/bulk-delete/`, { ids: bookIds });
  return res.data;
};

// 🔹 Bulk upload books (Excel + ZIP, with progress)
export const bulkUploadBooks = async (formData, onUploadProgress) => {
  // backend action uses 'bulk-upload' url_path
  const res = await axios.post(`${LIBRARY}/books/bulk-upload/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress && { onUploadProgress }),
  });
  return res.data;
};

// 🔹 Download Excel template for bulk upload
export const downloadTemplate = async () => {
  // NOTE: backend currently has no explicit template download endpoint.
  // Keep this call but point to admin reports path if available (placeholder).
  const res = await axios.get(`${LIBRARY}/books/template/download/`, {
    responseType: "blob",
  });
  return res;
};

// ===============================================================
// 📦 BOOK COPY OPERATIONS (Model 2 Integration)
// ===============================================================

// 🔹 Fetch all copies for a specific book
export const getBookCopies = async (bookCode) => {
  const res = await axios.get(`${LIBRARY}/books/${bookCode}/copies/`);
  return res.data;
};

// 🔹 Add new copy to an existing book
export const addBookCopy = async (bookCode) => {
  const res = await axios.post(`${LIBRARY}/bookcopies/add_copy/`, { book_code: bookCode });
  return res.data;
};

// 🔹 Edit individual BookCopy
export const editBookCopy = async (copyCode, payload) => {
  const res = await axios.patch(`${LIBRARY}/bookcopies/${copyCode}/`, payload);
  return res.data;
};

// 🔹 Delete a specific BookCopy
export const deleteBookCopy = async (copyCode) => {
  const res = await axios.delete(`${LIBRARY}/bookcopies/${copyCode}/`);
  return res.data;
};

// 🔹 Bulk delete copies
export const bulkDeleteCopies = async (ids) => {
  const res = await axios.post(`${LIBRARY}/bookcopies/bulk-delete/`, { ids });
  return res.data;
};

// 🔹 Generate barcode for a single copy
export const generateCopyBarcode = async (copyCode) => {
  const res = await axios.post(`${LIBRARY}/bookcopies/${copyCode}/generate_barcode/`);
  return res.data;
};

// ===============================================================
// 🧾 REPORTS & BARCODE EXPORTS
// ===============================================================

// 🔹 Download all book-level barcodes (PDF)
export const downloadAllBarcodesPDF = async () => {
  const res = await axios.get(`${ADMIN}/reports/active-issues/barcodes/all/`, { responseType: "blob" });
  return res;
};

// 🔹 Download selected book barcodes (PDF)
export const downloadSelectedBarcodesPDF = async (bookCodes) => {
  const res = await axios.post(
    `${ADMIN}/reports/active-issues/barcodes/selected/`,
    { book_codes: bookCodes },
    { responseType: "blob" }
  );
  return res;
};

// 🔹 Download single book barcode PNG (Book-level)
export const downloadSingleBookBarcode = async (bookCode) => {
  const res = await axios.get(`${ADMIN}/reports/barcodes/single/${bookCode}/`, {
    responseType: "blob",
  });
  return res;
};

// 🔹 Download single copy barcode PNG (Copy-level)
export const downloadCopyBarcode = async (copyCode) => {
  const res = await axios.get(`${ADMIN}/reports/barcodes/copy/${copyCode}/`, {
    responseType: "blob",
  });
  return res;
};

// 🔹 Download selected copies barcodes (ZIP)
export const downloadSelectedCopyBarcodesZIP = async (copyIds) => {
  const res = await axios.post(
    `${ADMIN}/reports/barcodes/selected_copies/`,
    { ids: copyIds },
    { responseType: "blob" }
  );
  return res;
};

// ===============================================================
// 📘 REPORTS & BOOK EXPORTS
// ===============================================================

export const downloadBookReport = async () => {
  const res = await axios.get(`${ADMIN}/reports/books/`, { responseType: "blob" });
  return res;
};

// ===============================================================
// 📊 ANALYTICS / DASHBOARD
// ===============================================================

export const getOverviewStats = async () => {
  const res = await axios.get(`${ADMIN}/dashboard/stats/`);
  return res.data;
};

export const getCategoryStats = async () => {
  const res = await axios.get(`${ADMIN}/reports/summary/`);
  return res.data.categories;
};

export const getReportsSummary = async () => {
  const res = await axios.get(`${ADMIN}/reports/transactions/`);
  return res.data;
};

// ===============================================================
// 🔁 TASK STATUS (for async barcode generation)
// ===============================================================

export const getTaskStatus = async (taskId) => {
  // Backend task-status endpoint is mounted at `/api/tasks/status/<id>/`
  const res = await axios.get(`tasks/status/${taskId}/`);
  return res.data;
};

// ===============================================================
// ✅ LEGACY FALLBACKS (Kept Intact for Compatibility)
// ===============================================================
// NOTE: These ensure older components using pre–BookCopy logic still work.
//       Do not remove for backward compatibility.
