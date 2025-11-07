// src/routes/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/common/Loader";

export default function ProtectedRoute({ children, roles = ["admin", "librarian", "student", "teacher", "user"] }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) return <Navigate to="/login" replace />;

  // role-based check
  if (!roles.includes(user.role)) {
    console.warn(`Access denied for role: ${user.role}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
