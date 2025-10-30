// src/api/libraryApi.js
import axios from "./axios"; // ✅ uses axios instance with auth + interceptors

// ---------------------------------------------------------------
// 📚 BOOK CRUD OPERATIONS
// ---------------------------------------------------------------

// src/api/libraryApi.js
export const getBooks = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`/library/books/?${params}`);
  const data = res.data;

  // ✅ Normalize response
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null };
  }

  return {
    results: data.results || [],
    count: data.count || 0,
    next: data.next,
    previous: data.previous,
  };
};

export const getBookDetails = async (bookId) => {
  const res = await axios.get(`/library/books/${bookId}/`);
  return res.data;
};

export const addBook = async (bookData) => {
  const res = await axios.post(`/library/books/`, bookData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateBook = async (bookId, bookData) => {
  const res = await axios.put(`/library/books/${bookId}/`, bookData);
  return res.data;
};

export const deleteBook = async (bookId) => {
  const res = await axios.delete(`/library/books/${bookId}/`);
  return res.data;
};

// ✅ NEW: Bulk delete for Admin
export const bulkDeleteBooks = async (bookIds) => {
  const res = await axios.post(`/library/books/bulk_delete/`, { ids: bookIds });
  return res.data;
};

// ---------------------------------------------------------------
// 🧾 REPORTS & EXPORTS
// ---------------------------------------------------------------

// 📘 Master Book CSV Report
export const downloadBookReport = async () => {
  const res = await axios.get(`/library/reports/books/`, { responseType: "blob" });
  return res;
};

// 📑 Book Copies CSV Report
export const downloadCopyReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`/library/reports/copies/?${params}`, { responseType: "blob" });
  return res;
};

// 🖨️ Printable Barcode PDF Report (A4 Layout)
export const downloadBarcodeReport = async (params = "") => {
  const res = await axios.get(`/library/reports/barcodes/?${params}`, { responseType: "blob" });
  return res;
};

// ✅ NEW: Bulk barcode PDF generation via POST (for selected books)
export const downloadBulkBarcodePDF = async (bookIds) => {
  const res = await axios.post(`/library/books/barcode-pdf/`, { ids: bookIds }, { responseType: "blob" });
  return res.data;
};

// ---------------------------------------------------------------
// 🏷️ BARCODE OPERATIONS
// ---------------------------------------------------------------

// Scan a barcode (Admin or Librarian)
export const scanBarcode = async (barcodeValue) => {
  const res = await axios.post(`/library/scan-barcode/`, { barcode_value: barcodeValue });
  return res.data;
};
