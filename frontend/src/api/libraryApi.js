// src/api/libraryApi.js
import axios from "./axios"; // ✅ Uses Axios instance with JWT interceptors

// ===============================================================
// 📚 BOOK CRUD OPERATIONS
// ===============================================================

// 🔹 Fetch all books with filters & pagination
export const getBooks = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`/books/?${params}`);
  const data = res.data;

  // Normalize pagination
  return Array.isArray(data)
    ? { results: data, count: data.length, next: null, previous: null }
    : {
        results: data.results || [],
        count: data.count || 0,
        next: data.next,
        previous: data.previous,
      };
};

// 🔹 Get single book details (with nested copies)
export const getBookDetails = async (bookCode) => {
  const res = await axios.get(`/books/${bookCode}/`);
  return res.data;
};

// 🔹 Add a new book (with live upload progress)
export const addBook = async (bookData, onUploadProgress) => {
  const res = await axios.post(`/books/`, bookData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress && { onUploadProgress }),
  });
  return res.data;
};

// 🔹 Edit/Update a book (PATCH preferred, fallback to PUT)
export const editBook = async (bookCode, formData) => {
  try {
    const res = await axios.patch(`/books/${bookCode}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (err) {
    if (err?.response?.status === 400 || err?.response?.status === 405) {
      const res = await axios.put(`/books/${bookCode}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    throw err;
  }
};

// 🔹 Delete a single book
export const deleteBook = async (bookCode) => {
  const res = await axios.delete(`/books/${bookCode}/`);
  return res.data;
};

// 🔹 Bulk delete books
export const bulkDeleteBooks = async (bookIds) => {
  const res = await axios.post(`/books/bulk_delete/`, { ids: bookIds });
  return res.data;
};

// 🔹 Bulk upload books (Excel + ZIP, with progress)
export const bulkUploadBooks = async (formData, onUploadProgress) => {
  const res = await axios.post(`/books/bulk_upload/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress && { onUploadProgress }),
  });
  return res.data;
};

// 🔹 Download Excel template for bulk upload
export const downloadTemplate = async () => {
  const res = await axios.get(`/books/template/download/`, {
    responseType: "blob",
  });
  return res;
};

// ===============================================================
// 📦 BOOK COPY OPERATIONS (Model 2 Integration)
// ===============================================================

// 🔹 Fetch all copies for a specific book
export const getBookCopies = async (bookCode) => {
  const res = await axios.get(`/books/${bookCode}/copies/`);
  return res.data;
};

// 🔹 Add new copy to an existing book
export const addBookCopy = async (bookCode) => {
  const res = await axios.post(`/bookcopies/add_copy/`, { book_code: bookCode });
  return res.data;
};

// 🔹 Edit individual BookCopy
export const editBookCopy = async (copyCode, payload) => {
  const res = await axios.patch(`/bookcopies/${copyCode}/`, payload);
  return res.data;
};

// 🔹 Delete a specific BookCopy
export const deleteBookCopy = async (copyCode) => {
  const res = await axios.delete(`/bookcopies/${copyCode}/`);
  return res.data;
};

// 🔹 Bulk delete copies
export const bulkDeleteCopies = async (ids) => {
  const res = await axios.post(`/bookcopies/bulk_delete/`, { ids });
  return res.data;
};

// 🔹 Generate barcode for a single copy
export const generateCopyBarcode = async (copyCode) => {
  const res = await axios.post(`/bookcopies/${copyCode}/generate_barcode/`);
  return res.data;
};

// ===============================================================
// 🧾 REPORTS & BARCODE EXPORTS
// ===============================================================

// 🔹 Download all book-level barcodes (PDF)
export const downloadAllBarcodesPDF = async () => {
  const res = await axios.get(`/reports/barcodes/all/`, { responseType: "blob" });
  return res;
};

// 🔹 Download selected book barcodes (PDF)
export const downloadSelectedBarcodesPDF = async (bookCodes) => {
  const res = await axios.post(
    `/reports/barcodes/selected/`,
    { book_codes: bookCodes },
    { responseType: "blob" }
  );
  return res;
};

// 🔹 Download single book barcode PNG (Book-level)
export const downloadSingleBookBarcode = async (bookCode) => {
  const res = await axios.get(`/reports/barcodes/single/${bookCode}/`, {
    responseType: "blob",
  });
  return res;
};

// 🔹 Download single copy barcode PNG (Copy-level)
export const downloadCopyBarcode = async (copyCode) => {
  const res = await axios.get(`/reports/barcodes/copy/${copyCode}/`, {
    responseType: "blob",
  });
  return res;
};

// 🔹 Download selected copies barcodes (ZIP)
export const downloadSelectedCopyBarcodesZIP = async (copyIds) => {
  const res = await axios.post(
    `/reports/barcodes/selected_copies/`,
    { ids: copyIds },
    { responseType: "blob" }
  );
  return res;
};

// ===============================================================
// 📘 REPORTS & BOOK EXPORTS
// ===============================================================

export const downloadBookReport = async () => {
  const res = await axios.get(`/reports/books/`, { responseType: "blob" });
  return res;
};

// ===============================================================
// 📊 ANALYTICS / DASHBOARD
// ===============================================================

export const getOverviewStats = async () => {
  const res = await axios.get(`/stats/overview/`);
  return res.data;
};

export const getCategoryStats = async () => {
  const res = await axios.get(`/stats/category/`);
  return res.data.categories;
};

export const getReportsSummary = async () => {
  const res = await axios.get(`/reports/summary/`);
  return res.data;
};

// ===============================================================
// 🔁 TASK STATUS (for async barcode generation)
// ===============================================================

export const getTaskStatus = async (taskId) => {
  const res = await axios.get(`/task_status/${taskId}/`);
  return res.data;
};

// ===============================================================
// ✅ LEGACY FALLBACKS (Kept Intact for Compatibility)
// ===============================================================
// NOTE: These ensure older components using pre–BookCopy logic still work.
//       Do not remove for backward compatibility.
