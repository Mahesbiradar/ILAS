// src/hooks/useTaskStatusPoller.js
import { useState, useEffect, useCallback } from "react";
import { getTaskStatus } from "../api/libraryApi";

/**
 * Hook for polling async task status
 * Used for long-running operations like bulk barcode generation
 */
export const useTaskStatusPoller = (taskId, pollInterval = 2000) => {
  const [status, setStatus] = useState("PENDING");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(!!taskId);

  const poll = useCallback(async () => {
    if (!taskId) {
      setIsPolling(false);
      return;
    }

    try {
      const data = await getTaskStatus(taskId);
      setStatus(data.status || "PENDING");
      setProgress(data.progress || 0);

      // Stop polling if complete or failed
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        setIsPolling(false);
      }

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      console.error("Task status poll error:", err);
      setError(err.message || "Failed to fetch task status");
      setIsPolling(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (!isPolling) return;

    // Poll immediately and then on interval
    poll();
    const interval = setInterval(poll, pollInterval);

    return () => clearInterval(interval);
  }, [isPolling, poll, pollInterval]);

  return {
    status,
    progress,
    error,
    isPolling,
    startPolling: () => setIsPolling(true),
    stopPolling: () => setIsPolling(false),
  };
};

export default useTaskStatusPoller;
