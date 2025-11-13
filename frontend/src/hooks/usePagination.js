// src/hooks/usePagination.js
import { useState, useCallback } from "react";

/**
 * Custom hook for managing pagination state
 * Handles page, page size, total count, and next/previous navigation
 */
export const usePagination = (initialPageSize = 20) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  const setPaginationData = useCallback((data) => {
    if (data) {
      setCount(data.count || 0);
      setNext(data.next);
      setPrevious(data.previous);
    }
  }, []);

  const goToPage = useCallback((newPage) => {
    if (newPage > 0) setPage(newPage);
  }, []);

  const goToNextPage = useCallback(() => {
    if (next) goToPage(page + 1);
  }, [next, page, goToPage]);

  const goToPreviousPage = useCallback(() => {
    if (previous) goToPage(page - 1);
  }, [previous, page, goToPage]);

  const totalPages = Math.ceil(count / pageSize);

  return {
    page,
    setPage: goToPage,
    pageSize,
    setPageSize,
    count,
    next,
    previous,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    setPaginationData,
  };
};

export default usePagination;
