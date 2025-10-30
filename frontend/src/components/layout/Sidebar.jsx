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

  // ✅ Updated Nav Items
  const nav = [
    { to: "/home", label: "Home", icon: <Home size={18} /> },
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/books", label: "Books", icon: <BookOpen size={18} /> },

    // 🛠️ Admin-only items
    { to: "/library-ops", label: "Library Ops", icon: <LibraryBig size={18} />, admin: true },
    { to: "/books-manager", label: "All Books Manager", icon: <BookCopy size={18} />, admin: true },
    { to: "/library-reports", label: "Library Reports", icon: <FileText size={18} />, admin: true },
    { to: "/members", label: "Members", icon: <Users size={18} />, admin: true },

    // ℹ️ General
    { to: "/about", label: "About", icon: <Info size={18} /> },
  ];

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: collapsed ? 0 : -280 }}
      transition={{ type: "tween" }}
      className="fixed md:static top-0 left-0 h-full w-64 bg-white shadow-[2px_0_6px_rgba(0,0,0,0.05)] flex flex-col z-30"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-[56px] px-5 bg-gradient-to-r from-blue-50 to-white shadow-[0_2px_6px_rgba(0,0,0,0.05)]">
        <Link to="/home" className="flex items-center gap-2">
          <BookOpen size={22} className="text-blue-600" />
          <span className="text-lg font-semibold text-blue-700 tracking-wide">ILAS</span>
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
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all
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
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="text-sm font-medium">{user?.username || "Guest"}</div>
            <div className="text-xs text-gray-500 capitalize">{user?.role || "visitor"}</div>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition"
          >
            <User size={15} /> Profile
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
