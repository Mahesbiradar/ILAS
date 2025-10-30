import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  /* ----------------------------------------------------------
   🧠 Helper: Save user + tokens to localStorage
  ---------------------------------------------------------- */
  const saveAuthData = (user, tokens) => {
    localStorage.setItem("access", tokens.access);
    localStorage.setItem("refresh", tokens.refresh);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  /* ----------------------------------------------------------
   🔐 Fetch current user if a valid token is present
  ---------------------------------------------------------- */
  const fetchUser = async () => {
    const access = localStorage.getItem("access");
    if (!access) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("auth/me/");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.warn("fetchUser failed:", err.response?.data || err.message);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  /* ----------------------------------------------------------
   🚪 Login
   Expected response format:
   {
     user: {...},
     tokens: { access: "...", refresh: "..." }
   }
  ---------------------------------------------------------- */
  const login = async (credentials) => {
    try {
      const res = await api.post("auth/login/", credentials);
      const user = res.data.user;
      const tokens = res.data.tokens || res.data;
      if (!user || !tokens?.access || !tokens?.refresh) {
        throw new Error("Invalid login response from server");
      }
      saveAuthData(user, tokens);
      toast.success(`Welcome back, ${user.username || "user"}!`);
      return user;
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      toast.error("Login failed. Please check your credentials.");
      throw err;
    }
  };

  /* ----------------------------------------------------------
   🧾 Signup
   Backend should return: { user, tokens }
  ---------------------------------------------------------- */
  const signup = async (payload) => {
    try {
      const res = await api.post("auth/register/", payload);
      if (res.data?.tokens && res.data?.user) {
        saveAuthData(res.data.user, res.data.tokens);
        toast.success("Account created & logged in");
        return res.data.user;
      } else {
        toast.success("Account created. Please login manually.");
        return null;
      }
    } catch (err) {
      console.error("Signup failed:", err.response?.data || err.message);
      toast.error("Signup failed. Try again.");
      throw err;
    }
  };

  /* ----------------------------------------------------------
   🚪 Logout — clears all localStorage tokens
  ---------------------------------------------------------- */
  const logout = () => {
    clearAuthData();
    toast.success("Logged out successfully");
  };

  /* ----------------------------------------------------------
   🧹 Helper: clear all auth data (used for logout or refresh failure)
  ---------------------------------------------------------- */
  const clearAuthData = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUser(null);
  };

  /* ----------------------------------------------------------
   🔁 Sync login/logout between tabs
  ---------------------------------------------------------- */
  useEffect(() => {
    const syncLogout = (e) => {
      if (e.key === "access" && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener("storage", syncLogout);
    return () => window.removeEventListener("storage", syncLogout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        fetchUser,
        isAuthenticated: !!user,
      }}
    >
      {!loading ? (
        children
      ) : (
        <div className="p-8 text-center text-gray-600">Loading authentication...</div>
      )}
    </AuthContext.Provider>
  );
}
