import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // 🔹 Fetch user if token is valid
  const fetchUser = async () => {
    try {
      const res = await api.get("auth/me/");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch {
      setUser(null);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // 🔹 Login
  const login = async (credentials) => {
    try {
      const res = await api.post("auth/login/", credentials);
      const { tokens, user } = res.data;
      if (!tokens || !user) throw new Error("Invalid response format");

      localStorage.setItem("access", tokens.access);
      localStorage.setItem("refresh", tokens.refresh);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      toast.success(`Welcome, ${user.username}!`);
      return { user };
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      toast.error("Login failed. Check your credentials.");
      throw err;
    }
  };

  // 🔹 Signup
  const signup = async (data) => {
    try {
      const res = await api.post("auth/register/", data);
      const tokens = res.data.tokens || {};
      const user = res.data.user;

      if (res.status === 201 && user) {
        localStorage.setItem("access", tokens.access || "");
        localStorage.setItem("refresh", tokens.refresh || "");
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        toast.success("Account created successfully!");
        return { user };
      } else {
        toast.error("Signup failed. Try again.");
        return false;
      }
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      toast.error("Signup failed. Try again.");
      throw err;
    }
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.clear();
    setUser(null);
    toast("Logged out successfully");
  };

  // 🔹 Refresh token
  const refreshAccessToken = async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return;
    try {
      const res = await api.post("auth/refresh/", { refresh });
      localStorage.setItem("access", res.data.access);
    } catch {
      logout();
    }
  };

  // Auto-refresh token every 13 min
  useEffect(() => {
    const interval = setInterval(refreshAccessToken, 13 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
