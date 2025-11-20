// src/services/transactionApi.js
import api from "../api/axios";

// Base admin route
const ADMIN = "v1/admin";

/**
 * ========================================================
 *  ISSUE BOOK
 *  POST /api/v1/admin/transactions/issue/
 * ========================================================
 */
export const issueBook = async (bookId, memberId, remarks = "") => {
  const res = await api.post(`${ADMIN}/transactions/issue/`, {
    book_id: bookId,
    member_id: memberId,
    remarks,
  });
  return res.data;
};

/**
 * ========================================================
 *  RETURN BOOK
 *  POST /api/v1/admin/transactions/return/
 * ========================================================
 */
export const returnBook = async (bookId, memberId, remarks = "") => {
  const res = await api.post(`${ADMIN}/transactions/return/`, {
    book_id: bookId,
    member_id: memberId,
    remarks,
  });
  return res.data;
};

/**
 * ========================================================
 *  UPDATE BOOK STATUS
 *  POST /api/v1/admin/transactions/status/
 * ========================================================
 */
export const updateBookStatus = async (bookId, status, remarks = "") => {
  const res = await api.post(`${ADMIN}/transactions/status/`, {
    book_id: bookId,
    status: String(status).toUpperCase(),
    remarks,
  });
  return res.data;
};

/**
 * ========================================================
 *  GET ACTIVE TRANSACTIONS
 *  GET /api/v1/admin/transactions/active/
 * ========================================================
 */
export const getActiveTransactions = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/transactions/active/?${params}`);

  const data = res.data;
  return {
    results: data.results || [],
    count: data.count || 0,
    next: data.next,
    previous: data.previous,
  };
};

/**
 * ========================================================
 *  LOOKUP BOOK BY BARCODE / BOOK CODE
 *  CORRECT ENDPOINT → /api/v1/public/lookup/<book_code>/
 * ========================================================
 *
 * Required response fields after normalization:
 *  - id
 *  - book_code
 *  - title
 *  - author
 *  - isbn
 *  - category
 *  - shelf_location
 *  - status
 *  - issued_to
 *  - due_date
 *
 */
export const lookupBookByCode = async (bookCode) => {
  try {
    // This is the ONLY correct backend URL
    const url = `v1/public/lookup/${encodeURIComponent(bookCode)}/`;

    const res = await api.get(url);
    const data = res.data;

    // Normalize backend response
    return {
      id: data.id,
      book_code: data.book_code,
      title: data.title,
      author: data.author,
      isbn: data.isbn,
      category: data.category,
      shelf_location: data.shelf_location,
      status: data.status,
      issued_to: data.issued_to,
      due_date: data.due_date,
      raw: data,
    };
  } catch (err) {
    if (err?.response?.status === 404) {
      const e = new Error("Book not found");
      e.code = 404;
      throw e;
    }
    throw err;
  }
};


/**
 * ========================================================
 *  GET ALL TRANSACTIONS (HISTORY)
 *  GET /api/v1/admin/transactions/all/
 * ========================================================
 */
export const getAllTransactions = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/transactions/all/?${params}`);

  return {
    results: res.data.results || [],
    count: res.data.count || 0,
    next: res.data.next,
    previous: res.data.previous,
  };
};

/**
 * ========================================================
 *  DOWNLOAD TRANSACTION REPORT CSV
 *  GET /api/v1/admin/reports/transactions/
 * ========================================================
 */
export const downloadTransactionsReport = async (params = {}) => {
  return await api.get(`${ADMIN}/reports/transactions/`, {
    params,
    responseType: "blob",
  });
};
