// src/services/reportApi.js
import api from "../api/axios";

const ADMIN = "v1/admin";

/**
 * Master Report (all books with metadata)
 * GET /api/v1/admin/reports/master/?start_date=...&end_date=...
 * Returns: CSV blob
 */
export const downloadMasterReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/reports/master/?${params}`, {
    responseType: "blob",
  });
  return res;
};

/**
 * Transaction Report (all transactions)
 * GET /api/v1/admin/reports/transactions/?start_date=...&end_date=...
 * Returns: CSV blob
 */
export const downloadTransactionReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/reports/transactions/?${params}`, {
    responseType: "blob",
  });
  return res;
};

/**
 * Inventory Report (book status counts)
 * GET /api/v1/admin/reports/inventory/
 * Returns: CSV blob
 */
export const downloadInventoryReport = async () => {
  const res = await api.get(`${ADMIN}/reports/inventory/`, {
    responseType: "blob",
  });
  return res;
};

/**
 * Active Issues Report
 * GET /api/v1/admin/reports/active-issues/
 * Returns: JSON or CSV depending on accept header
 */
export const getActiveIssuesReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/reports/active-issues/?${params}`);
  return res.data;
};

/**
 * Overdue Report
 * GET /api/v1/admin/reports/overdue/
 * Returns: JSON or CSV
 */
export const getOverdueReport = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(`${ADMIN}/reports/overdue/?${params}`);
  return res.data;
};

/**
 * Member History Report
 * GET /api/v1/admin/reports/member/<member_id>/history/
 * Returns: Member's transaction history
 */
export const getMemberHistoryReport = async (memberId, filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await api.get(
    `${ADMIN}/reports/member/${memberId}/history/?${params}`
  );
  return res.data;
};

/**
 * Download all book barcodes as PDF
 * GET /api/v1/admin/reports/barcodes/all/ (or similar)
 * Returns: PDF blob
 */
export const downloadAllBarcodesPDF = async () => {
  const res = await api.get(`${ADMIN}/reports/barcodes/all/`, {
    responseType: "blob",
  });
  return res;
};

/**
 * Download selected book barcodes as PDF
 * POST /api/v1/admin/reports/barcodes/selected/
 * Body: { book_codes: [...] }
 * Returns: PDF blob
 */
export const downloadSelectedBarcodesPDF = async (bookCodes) => {
  const res = await api.post(
    `${ADMIN}/reports/barcodes/selected/`,
    { book_codes: bookCodes },
    { responseType: "blob" }
  );
  return res;
};

/**
 * Download single book barcode
 * GET /api/v1/admin/reports/barcodes/single/<book_code>/
 * Returns: PNG blob
 */
export const downloadSingleBarcode = async (bookCode) => {
  const res = await api.get(`${ADMIN}/reports/barcodes/single/${bookCode}/`, {
    responseType: "blob",
  });
  return res;
};
