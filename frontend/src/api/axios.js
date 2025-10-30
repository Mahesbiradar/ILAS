// src/api/axios.js
import axios from "axios";

/**
 * ✅ API Base URL
 * Uses .env variable if provided, else defaults to localhost backend.
 * Example in your .env file:
 *   VITE_API_BASE=http://127.0.0.1:8000/api/
 */
const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api/";

/**
 * ✅ Axios Instance
 * Handles token injection, JSON headers, and response interceptors globally.
 */
const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  // withCredentials: true, // enable only if using cookie auth
});

/* ------------------------------------------------------------------ */
/* 🔐 REQUEST INTERCEPTOR — attach JWT token before each request */
/* ------------------------------------------------------------------ */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ------------------------------------------------------------------ */
/* 🔁 RESPONSE INTERCEPTOR — auto refresh token if expired (401) */
/* ------------------------------------------------------------------ */
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    // If unauthorized and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for ongoing refresh request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = "Bearer " + token;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        isRefreshing = false;
        console.warn("⚠️ No refresh token found, logging out...");
        clearAuthData();
        return Promise.reject(error);
      }

      try {
        // 🔄 Refresh token request
        const res = await axios.post(`${API_BASE}auth/refresh/`, { refresh });
        const newAccess = res.data.access || res.data.tokens?.access;
        if (!newAccess) throw new Error("No access token returned");

        // Save and apply new token
        localStorage.setItem("access", newAccess);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        isRefreshing = false;

        return api(originalRequest);
      } catch (err) {
        console.error("Token refresh failed:", err);
        processQueue(err, null);
        isRefreshing = false;
        clearAuthData();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

/* ------------------------------------------------------------------ */
/* 🧹 HELPER: clear all auth data (used on logout or refresh fail) */
/* ------------------------------------------------------------------ */
function clearAuthData() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}

export default api;
