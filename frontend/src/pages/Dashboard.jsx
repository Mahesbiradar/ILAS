import React from "react";
import { useAuth } from "../context/AuthProvider";
import UserDashboard from "../components/dashboard/UserDashboard";
import AdminDashboard from "../components/dashboard/AdminDashboard";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      {user?.role === "admin" ? <AdminDashboard /> : <UserDashboard />}
    </>
  );
}
