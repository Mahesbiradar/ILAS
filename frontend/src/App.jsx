import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🧱 Layout
import MainLayout from "./components/layout/MainLayout";

// 📄 Pages - Public & Common
import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import Unauthorized from "./pages/Unauthorized";
import Profile from "./pages/Profile";

// 📄 Pages - User Pages
import Books from "./pages/Books";
import UserDashboard from "./pages/user/Dashboard";
import UserTransactions from "./pages/user/Transactions";

// 📄 Pages - Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import BooksManager from "./pages/admin/BooksManager";
import LibraryOperations from "./pages/admin/LibraryOperations";
import MembersManager from "./pages/admin/MembersManager";
import AdminTransactions from "./pages/admin/Transactions";
import Reports from "./pages/admin/Reports";

// 🔐 Auth & Role Guards
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleGuard from "./routes/RoleGuard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" reverseOrder={false} />

        <Routes>
          {/* ==========================
              🔓 Public Routes
          =========================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ==========================
              🔐 Protected Routes
          =========================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirect root to /home */}
            <Route index element={<Navigate to="home" replace />} />

            {/* Common Routes (All roles) */}
            <Route
              path="home"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian","student","teacher"]}>
                  <Home />
                </RoleGuard>
              }
            />
            <Route
              path="books"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian","student","teacher"]}>
                  <Books />
                </RoleGuard>
              }
            />
            <Route
              path="about"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian","student","teacher"]}>
                  <About />
                </RoleGuard>
              }
            />

            {/* 👥 Members (Admin + Librarian) */}
            <Route
              path="admin/members"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <MembersManager />
                </RoleGuard>
              }
            />

            {/* 💳 Transactions - User */}
            <Route
              path="user/transactions"
              element={
                <RoleGuard allowedRoles={["user", "student", "teacher"]}>
                  <UserTransactions />
                </RoleGuard>
              }
            />

            {/* 💳 Transactions - Admin */}
            <Route
              path="admin/transactions"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <AdminTransactions />
                </RoleGuard>
              }
            />

            {/* 🛠️ Library Management Tools (Admin Only) */}
            <Route
              path="admin/library-ops"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <LibraryOperations />
                </RoleGuard>
              }
            />

            {/* 📘 Books Manager (Admin Only) */}
            <Route
              path="admin/books"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <BooksManager />
                </RoleGuard>
              }
            />

            {/* 📊 Reports (Admin Only) */}
            <Route
              path="admin/reports"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <Reports />
                </RoleGuard>
              }
            />

            {/* Dashboard - User */}
            <Route
              path="user/dashboard"
              element={
                <RoleGuard allowedRoles={["user", "student", "teacher"]}>
                  <UserDashboard />
                </RoleGuard>
              }
            />

            {/* 👤 Profile */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* ❌ 404 Fallback */}
          <Route
            path="*"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen text-center">
                <h1 className="text-5xl font-bold text-red-600">404</h1>
                <p className="text-gray-500 mt-2">
                  The page you’re looking for doesn’t exist or has been moved.
                </p>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
