import React from "react";
import { Toaster } from "react-hot-toast";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout
import MainLayout from "./layout/MainLayout";

// Pages
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Members from "./pages/Members";
import Transactions from "./pages/Transactions";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Context & Guards
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🔐 Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🏠 Main Layout (Protected Routes) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Home />} />

            {/* 👥 User Access */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="members" element={<Members />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="about" element={<About />} />

            {/* 🛠️ Admin Access Only */}
            <Route
              path="admin/dashboard"
              element={
                <RoleGuard roles={["admin"]}>
                  <Dashboard />
                </RoleGuard>
              }
            />
            <Route
              path="admin/members"
              element={
                <RoleGuard roles={["admin"]}>
                  <Members />
                </RoleGuard>
              }
            />
            <Route
              path="admin/transactions"
              element={
                <RoleGuard roles={["admin"]}>
                  <Transactions />
                </RoleGuard>
              }
            />
          </Route>
        </Routes>

        {/* Toast Notification */}
        <Toaster position="top-right" reverseOrder={false} />
      </Router>
    </AuthProvider>
  );
}

export default App;
