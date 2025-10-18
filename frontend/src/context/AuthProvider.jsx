import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await API.get("auth/me/");
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await API.post("auth/login/", credentials);
      localStorage.setItem("access", res.data.access);
      setUser(res.data.user);
      toast.success("Login successful");
    } catch (err) {
      toast.error("Invalid credentials");
    }
  };

  const signup = async (data) => {
    try {
      const res = await API.post("auth/register/", data);
      toast.success("Account created! Please login.");
    } catch (err) {
      toast.error("Signup failed");
    }
  };

  const logout = async () => {
    localStorage.removeItem("access");
    setUser(null);
    toast("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
