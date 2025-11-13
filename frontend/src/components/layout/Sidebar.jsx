import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  BookOpen,
  Users,
  Info,
  LibraryBig,
  LayoutDashboard,
  LogOut,
  User,
  X,
  BookCopy,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthProvider";

export default function Sidebar({ collapsed, onClose, user }) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  // ✅ Updated Nav Items — use the exact labels/paths requested
  const nav = [
    // Public / User
    { to: "/", label: "Home", icon: <Home size={16} /> },
    { to: "/books", label: "Books", icon: <BookOpen size={16} /> },
    { to: "/user/dashboard", label: "User Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/user/transactions", label: "User Transactions", icon: <BookOpen size={16} /> },
    { to: "/about", label: "About", icon: <Info size={16} /> },

    // Admin-only
    { to: "/admin/dashboard", label: "Admin Dashboard", icon: <LayoutDashboard size={16} />, admin: true },
    { to: "/admin/books", label: "BooksManager", icon: <BookOpen size={16} />, admin: true },
    { to: "/admin/library-ops", label: "LibraryOperations", icon: <LibraryBig size={16} />, admin: true },
    { to: "/admin/reports", label: "Reports", icon: <FileText size={16} />, admin: true },
    { to: "/admin/members", label: "MembersManager", icon: <Users size={16} />, admin: true },
    { to: "/admin/transactions", label: "AdminTransactionList", icon: <BookCopy size={16} />, admin: true },
    { to: "/admin/userview", label: "AdminUserView", icon: <User size={16} />, admin: true },
  ];

  return (
    <motion.aside
      initial={{ x: -208 }}
      animate={{ x: collapsed ? 0 : -208 }}
      transition={{ type: "tween" }}
      className="fixed md:static top-0 left-0 h-full w-52 bg-white shadow-[2px_0_6px_rgba(0,0,0,0.05)] flex flex-col z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[56px] px-5 bg-gradient-to-r from-blue-50 to-white shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
        <Link to="/home" className="flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          <span className="text-base font-semibold text-blue-700 tracking-wide">ILAS</span>
        </Link>
        <button
          className="md:hidden p-1 rounded hover:bg-gray-100"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
        {nav.map((item) => {
          if (item.admin && user?.role !== "admin") return null;
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-2 py-2 rounded-md text-xs transition-all
                ${
                  active
                    ? "bg-blue-100 text-blue-700 font-semibold shadow-sm"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              onClick={() => {
                window.scrollTo(0, 0);
                if (typeof onClose === "function") onClose();
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div className="p-4 mt-auto border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xs">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="text-xs font-medium">{user?.username || "Guest"}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role || "visitor"}</div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 mt-2">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-gray-700 hover:bg-gray-100 transition"
          >
            <User size={14} /> Profile
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
