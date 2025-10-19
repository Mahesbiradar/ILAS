// src/context/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch current user if access token exists
  const fetchUser = async () => {
    const access = localStorage.getItem("access");
    if (!access) {
      setLoading(false);
      setUser(null);
      return;
    }
    try {
      const res = await api.get("auth/me/");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.warn("fetchUser failed", err.response?.data || err.message);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  // Login
  const login = async (credentials) => {
    const res = await api.post("auth/login/", credentials);
    // Expected format: { user, tokens: { access, refresh } }
    const tokens = res.data.tokens || res.data;
    const loggedUser = res.data.user;
    const access = tokens?.access;
    const refresh = tokens?.refresh;
    if (!access || !refresh || !loggedUser) {
      throw new Error("Invalid login response from server");
    }
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    return { user: loggedUser };
  };

  // Signup
  const signup = async (payload) => {
    const res = await api.post("auth/register/", payload);
    // if backend returns tokens, store them and set user
    if (res.data?.tokens) {
      const { access, refresh } = res.data.tokens;
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      toast.success("Account created & logged in");
      return res.data.user;
    } else {
      toast.success("Account created, please login");
      return null;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, fetchUser }}
    >
      {!loading ? children : <div className="p-8">Loading...</div>}
    </AuthContext.Provider>
  );
}
