// src/pages/Dashboard.jsx
import React from "react";
import { useAuth } from "../context/AuthProvider";
import AdminDashboard from "../components/dashboard/AdminDashboard";
import UserDashboard from "../components/dashboard/UserDashboard";
import Loader from "../components/common/Loader";

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <p className="text-center mt-10">Please log in to continue.</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {user.role === "admin" ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
