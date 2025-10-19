import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// 🧱 Layout
import MainLayout from "./components/layout/MainLayout";

// 📄 Pages
import Home from "./pages/Home"; // Shared home page for user & admin
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Members from "./pages/Members";
import Login from "./pages/Login";
import LibraryOps from "./pages/LibraryOps";
import UserTransactions from "./pages/UserTransactions";
import AdminTransactions from "./pages/AdminTransactions";
import About from "./pages/About"; // optional About page

// 🔐 Auth & Role Guards
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./routes/ProtectedRoute";
import RoleGuard from "./routes/RoleGuard";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ==========================
              🔓 Public Routes
          =========================== */}
          <Route path="/login" element={<Login />} />

          {/* ==========================
              🔐 Protected Main Routes
          =========================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* ==========================
                🏠 Common Home Page
                (Admin, Librarian, User)
            =========================== */}
            <Route
              path="home"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <Home />
                </RoleGuard>
              }
            />

            {/* ==========================
                📚 Common Books Page
            =========================== */}
            <Route
              path="books"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <Books />
                </RoleGuard>
              }
            />

            {/* ==========================
                🧭 Dashboard
            =========================== */}
            <Route
              path="dashboard"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <Dashboard />
                </RoleGuard>
              }
            />

            {/* ==========================
                👥 Member Management (Admin + Librarian)
            =========================== */}
            <Route
              path="members"
              element={
                <RoleGuard allowedRoles={["admin", "librarian"]}>
                  <Members />
                </RoleGuard>
              }
            />

            {/* ==========================
                💳 Transactions
            =========================== */}
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

            {/* ==========================
                🛠️ Library Operations (Admin Only)
            =========================== */}
            <Route
              path="library-ops"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <LibraryOps />
                </RoleGuard>
              }
            />

            {/* ==========================
                ℹ️ About Page
            =========================== */}
            <Route
              path="about"
              element={
                <RoleGuard allowedRoles={["user", "admin", "librarian"]}>
                  <About />
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

        {/* 🔔 Toast Notifications */}
        <Toaster position="top-right" reverseOrder={false} />
      </AuthProvider>
    </Router>
  );
}

export default App;
