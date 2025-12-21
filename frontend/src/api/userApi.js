// src/api/userApi.js
import api from "./axios";

const USER = "v1/library/user";

// ---------------------------------------------
// USER DASHBOARD STATS
// GET /api/v1/library/user/dashboard/
// ---------------------------------------------
export async function getUserDashboardStats() {
  const res = await api.get(`${USER}/dashboard/`);
  return res.data;
}

// ---------------------------------------------
// USER TRANSACTIONS HISTORY
// GET /api/v1/library/user/transactions/
// Supports: page, page_size, txn_type, search, start_date, end_date
// ---------------------------------------------
export async function getUserTransactions(params = {}) {
  const res = await api.get(`${USER}/transactions/`, { params });

  return {
    results: res.data.results || [],
    count: res.data.count || 0,
    next: res.data.next || null,
    previous: res.data.previous || null,
  };
}
