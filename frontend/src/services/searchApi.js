// src/services/searchApi.js
import api from "../api/axios";

const ADMIN = "v1/admin";

/**
 * Quick book search (autocomplete/dropdown)
 * GET /api/v1/admin/ajax/book-search/?q=term&page=1&page_size=10
 * Returns: Paginated book results { count, next, previous, results }
 */
export const quickBookSearch = async (query, page = 1, pageSize = 10) => {
  const params = new URLSearchParams({
    q: query.trim(),
    page,
    page_size: pageSize,
  }).toString();
  const res = await api.get(`${ADMIN}/ajax/book-search/?${params}`);
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
 * Quick user search (autocomplete/dropdown)
 * GET /api/v1/admin/ajax/user-search/?q=term&page=1&page_size=10
 * Returns: Paginated user results { count, next, previous, results }
 */
export const quickUserSearch = async (query, page = 1, pageSize = 10) => {
  const params = new URLSearchParams({
    q: query.trim(),
    page,
    page_size: pageSize,
  }).toString();
  const res = await api.get(`${ADMIN}/ajax/user-search/?${params}`);
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
