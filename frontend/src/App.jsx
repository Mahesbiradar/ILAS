import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🧱 Layout
import MainLayout from "./components/layout/MainLayout";

// 📄 Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Members from "./pages/Members";
import Login from "./pages/Login";
import LibraryOps from "./pages/LibraryOps";
import AllBooksManager from "./pages/AllBooksManager"; // ✅ New Page
import LibraryReports from "./pages/LibraryReports";   // ✅ New Page
import UserTransactions from "./pages/UserTransactions";
import AdminTransactions from "./pages/AdminTransactions";
import About from "./pages/About";
import Unauthorized from "./pages/Unauthorized";

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
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <Home />
                </RoleGuard>
              }
            />
            <Route
              path="books"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <Books />
                </RoleGuard>
              }
            />
            <Route
              path="dashboard"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="about"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <About />
                </RoleGuard>
              }
            />

            {/* 👥 Members (Admin + Librarian) */}
            <Route
              path="members"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <Members />
                </RoleGuard>
              }
            />

            {/* 💳 Transactions */}
            <Route
              path="transactions/user"
              element={
                <RoleGuard allowedRoles={["user", "student"]}>
                  <UserTransactions />
                </RoleGuard>
              }
            />
            <Route
              path="transactions/admin"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <AdminTransactions />
                </RoleGuard>
              }
            />

            {/* 🛠️ Library Management Tools (Admin Only) */}
            <Route
              path="library-ops"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <LibraryOps />
                </RoleGuard>
              }
            />

            {/* 📘 All Books Manager (Admin Only) */}
            <Route
              path="books-manager"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <AllBooksManager />
                </RoleGuard>
              }
            />

            {/* 📊 Reports Dashboard (Admin Only) */}
            <Route
              path="library-reports"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <LibraryReports />
                </RoleGuard>
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
