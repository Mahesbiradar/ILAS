import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🧩 Layout
import MainLayout from "./layout/MainLayout";

// 🧭 Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Members from "./pages/Members";
import Transactions from "./pages/Transactions";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// 🔐 Context & Route Guards
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* ===========================
              🔓 Public Routes
          ============================ */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ===========================
              🔐 Protected Main Routes
          ============================ */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* 🏠 Common User Routes */}
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="about" element={<About />} />

            {/* 👥 Members & Transactions (Staff Access) */}
            <Route
              path="members"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <Members />
                </RoleGuard>
              }
            />
            <Route
              path="transactions"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <Transactions />
                </RoleGuard>
              }
            />

            {/* 🛠️ Admin-Only Routes */}
            <Route
              path="admin/dashboard"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="admin/members"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <Members />
                </RoleGuard>
              }
            />
            <Route
              path="admin/transactions"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <Transactions />
                </RoleGuard>
              }
            />
          </Route>
        </Routes>

        {/* Global Toaster Notification */}
        <Toaster position="top-right" reverseOrder={false} />
      </AuthProvider>
    </Router>
  );
}

export default App;
