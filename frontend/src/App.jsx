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
import AdminUserView from "./pages/admin/AdminUserView";

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
            {/* Render Home at root */}
            <Route index element={<Home />} />

            {/* Common Routes (All roles) */}
            {/* Keep explicit home route for compatibility */}
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

            {/* Admin routes */}
            <Route
              path="admin/dashboard"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <AdminDashboard />
                </RoleGuard>
              }
            />

            <Route
              path="admin/books"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <BooksManager />
                </RoleGuard>
              }
            />

            <Route
              path="admin/library-ops"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <LibraryOperations />
                </RoleGuard>
              }
            />

            <Route
              path="admin/reports"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <Reports />
                </RoleGuard>
              }
            />

            <Route
              path="admin/members"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <MembersManager />
                </RoleGuard>
              }
            />

            <Route
              path="admin/transactions"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <AdminTransactions />
                </RoleGuard>
              }
            />

            <Route
              path="admin/userview"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <AdminUserView />
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
