// src/services/transactionApi.js
import api from "../api/axios";

const ADMIN = "v1/admin";

/**
 * Issue a book to a member
 * POST /api/v1/admin/transactions/issue/
 * Body: { book_id, member_id, remarks? }
 */
export const issueBook = async (bookId, memberId, remarks = "") => {
  const res = await api.post(`${ADMIN}/transactions/issue/`, {
    book_id: bookId,
    member_id: memberId,
    remarks: remarks,
  });
  return res.data;
};

/**
 * Return a book from a member
 * POST /api/v1/admin/transactions/return/
 * Body: { book_id, member_id, remarks? }
 * Returns: { detail, book_code, fine_amount }
 */
export const returnBook = async (bookId, memberId, remarks = "") => {
  const res = await api.post(`${ADMIN}/transactions/return/`, {
    book_id: bookId,
    member_id: memberId,
    remarks: remarks,
  });
  return res.data;
};

/**
 * Update book status (Lost, Damaged, Maintenance, Available, Removed)
 * POST /api/v1/admin/transactions/status/
 * Body: { book_id, status, remarks? }
 * status ∈ {LOST, DAMAGED, MAINTENANCE, AVAILABLE, REMOVED}
 */
export const updateBookStatus = async (bookId, status, remarks = "") => {
  const res = await api.post(`${ADMIN}/transactions/status/`, {
    book_id: bookId,
    status: status.toUpperCase(),
    remarks: remarks,
  });
  return res.data;
};

/**
 * Get active transactions (currently issued books)
 * GET /api/v1/admin/transactions/active/?page=1&page_size=20&member_id=<id>
 */
export const getActiveTransactions = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/transactions/active/?${params}`);
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

/**
 * Lookup a book by barcode/code (for barcode scanner)
 * GET /api/v1/library/books/<book_code>/
 * Returns: { book_code, title, author, isbn, status, shelf_location, issued_to, due_date }
 */
export const lookupBookByCode = async (bookCode) => {
  try {
    const res = await api.get(`v1/library/books/${bookCode}/`);
    return res.data;
  } catch (err) {
    // Return 404-friendly error
    if (err?.response?.status === 404) {
      throw new Error("Book not found");
    }
    throw err;
  }
};
