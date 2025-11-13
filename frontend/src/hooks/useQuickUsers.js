// src/hooks/useQuickUsers.js
import { useState, useCallback } from "react";
import { quickUserSearch } from "../services/searchApi";

/**
 * Hook for quick user search (autocomplete/dropdown in forms)
 * Handles debouncing and pagination
 */
export const useQuickUsers = () => {
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
      const data = await quickUserSearch(query, page, pageSize);
      setResults(data.results || []);
      return data;
    } catch (err) {
      console.error("User search error:", err);
      setError(err.message || "Failed to search users");
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

export default useQuickUsers;
