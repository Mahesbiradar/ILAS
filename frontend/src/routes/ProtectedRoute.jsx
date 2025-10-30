// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/common/Loader";

export default function ProtectedRoute({ children, role = "any" }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Role-based protection
  if (role !== "any" && user.role !== role) {
    console.warn(`Access denied for role: ${user.role}, required: ${role}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
