import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import UserTransactions from "./pages/UserTransactions";
import AdminTransactions from "./pages/AdminTransactions";

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
            {/* 🏠 Common Routes */}
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<Books />} />

            {/* 👥 Member Management */}
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

            {/* 🛠️ Library Operations (Admin Only) */}
            <Route
              path="library-ops"
              element={
                <RoleGuard allowedRoles={["admin"]}>
                  <LibraryOps />
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
