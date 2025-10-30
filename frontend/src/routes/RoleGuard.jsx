// src/components/RoleGuard.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import Loader from "../components/common/Loader";

export default function RoleGuard({ allowedRoles = [], redirect = "/unauthorized", children }) {
  const { user, loading } = useAuth();

  // Still fetching auth → show loader
  if (loading) return <Loader />;

  // Not logged in → go to login
  if (!user) {
    console.warn("⚠️ RoleGuard: No user found, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  // No role on user or not authorized → redirect
  if (!user.role || !allowedRoles.includes(user.role)) {
    console.warn(`🚫 RoleGuard: Access denied for role "${user.role}"`);
    return <Navigate to={redirect} replace />;
  }

  // Authorized → render protected content
  return children;
}
