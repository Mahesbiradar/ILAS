// src/hooks/useAnnouncements.js
import { useState, useEffect, useCallback } from "react";
import { getAnnouncements } from "../services/announcementApi";

/**
 * Hook for fetching and caching announcements
 * Displays system announcements on home page
 */
export const useAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.warn("Failed to load announcements:", err.message);
      setError(err.message);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    // Refresh announcements every 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnnouncements]);

  return {
    announcements,
    loading,
    error,
    refetch: fetchAnnouncements,
  };
};

export default useAnnouncements;
