// src/hooks/useQuickBooks.js
import { useState, useCallback } from "react";
import { quickBookSearch } from "../services/searchApi";

/**
 * Hook for quick book search (autocomplete/dropdown in forms)
 * Handles debouncing and pagination
 */
export const useQuickBooks = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, page = 1, pageSize = 10) => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await quickBookSearch(query, page, pageSize);
      setResults(data.results || []);
      return data;
    } catch (err) {
      console.error("Book search error:", err);
      setError(err.message || "Failed to search books");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  };
};

export default useQuickBooks;
