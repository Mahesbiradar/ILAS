// src/api/libraryApi.js
import axios from "./axios"; // ✅ uses Axios instance with JWT interceptors

// ===============================================================
// 📚 BOOK CRUD OPERATIONS
// ===============================================================

// 🔹 Fetch all books with filters & pagination
export const getBooks = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`/library/books/?${params}`);
  const data = res.data;

  // Normalize response for pagination
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

// 🔹 Get single book details (includes copies)
export const getBookDetails = async (bookCode) => {
  const res = await axios.get(`/library/books/${bookCode}/`);
  return res.data;
};

// 🔹 Add a new book (with cover image)
export const addBook = async (bookData) => {
  const res = await axios.post(`/library/books/`, bookData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// 🔹 Edit/Update a book (uses PATCH, fallback to PUT if needed)
export const editBook = async (bookCode, formData) => {
  try {
    const res = await axios.patch(`/library/books/${bookCode}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  } catch (patchErr) {
    if (patchErr?.response?.status === 400 || patchErr?.response?.status === 405) {
      const res = await axios.put(`/library/books/${bookCode}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    }
    throw patchErr;
  }
};

// 🔹 Delete a single book (by book_code)
export const deleteBook = async (bookCode) => {
  const res = await axios.delete(`/library/books/${bookCode}/`);
  return res.data;
};

// 🔹 Bulk delete books (admin)
export const bulkDeleteBooks = async (bookIds) => {
  const res = await axios.post(`/library/books/bulk_delete/`, { ids: bookIds });
  return res.data;
};

// 🔹 Bulk upload books (Excel + ZIP)
export const bulkUploadBooks = async (formData) => {
  const res = await axios.post(`/library/books/bulk_upload/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// 🔹 Download Excel template for bulk upload
export const downloadTemplate = async () => {
  const res = await axios.get(`/library/books/template/`, {
    responseType: "blob",
  });
  return res;
};

// ===============================================================
// 🧾 REPORTS & EXPORTS
// ===============================================================

// 📘 Download Books CSV report
export const downloadBookReport = async () => {
  const res = await axios.get(`/library/reports/books/`, {
    responseType: "blob",
  });
  return res;
};

// 📑 Download Copies CSV report
export const downloadCopyReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await axios.get(`/library/reports/copies/?${params}`, {
    responseType: "blob",
  });
  return res;
};

// 🏷️ Download Barcode PDF report (A4)
export const downloadBarcodeReport = async (params = "") => {
  const res = await axios.get(`/library/reports/barcodes/?${params}`, {
    responseType: "blob",
  });
  return res;
};

// ✅ Bulk barcode PDF generation (for multiple books)
export const downloadBulkBarcodePDF = async (bookIds) => {
  const res = await axios.post(
    `/library/books/barcode-pdf/`,
    { ids: bookIds },
    { responseType: "blob" }
  );
  return res.data;
};

// ===============================================================
// 🏷️ BARCODE OPERATIONS
// ===============================================================

// Scan barcode for details (Admin or Librarian)
export const scanBarcode = async (barcodeValue) => {
  const res = await axios.post(`/library/scan-barcode/`, {
    barcode_value: barcodeValue,
  });
  return res.data;
};

export const addCopy = async (data) =>
  axios.post('/library/copies/', data);

export const editCopy = async (copyId, data) =>
  axios.patch(`/library/copies/${copyId}/`, data);

export const deleteCopy = async (copyId) =>
  axios.delete(`/library/copies/${copyId}/`);

