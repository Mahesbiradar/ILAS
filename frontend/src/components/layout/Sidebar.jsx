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
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthProvider";

export default function Sidebar({ collapsed, onClose, user }) {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const isOpen = collapsed;

  const userNav = [
    { to: "/", label: "Home", icon: <Home size={16} /> },
    { to: "/books", label: "Books", icon: <BookOpen size={16} /> },
    { to: "/about", label: "About", icon: <Info size={16} /> },
    { to: "/user/dashboard", label: "User Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/user/transactions", label: "User Transactions", icon: <BookOpen size={16} /> },
  ];

  const adminNav = [
    { to: "/admin/dashboard", label: "Admin Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/admin/books", label: "Books Manager", icon: <BookOpen size={16} /> },
    { to: "/admin/library-ops", label: "Library Operations", icon: <LibraryBig size={16} /> },
    { to: "/admin/members", label: "Members Manager", icon: <Users size={16} /> },
    { to: "/admin/transactions", label: "Transactions", icon: <BookCopy size={16} /> },
    { to: "/admin/userview", label: "Admin User View", icon: <User size={16} /> },
  ];

  const nav = user?.role === "admin" ? adminNav : userNav;

  return (
    <motion.aside
      initial={{ x: -240 }}
      animate={{ x: isOpen ? 0 : -240 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed md:static inset-y-0 left-0 w-60 bg-white shadow-lg flex flex-col z-40"
      role="navigation"
      aria-label="Sidebar"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-14 px-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <Link to="/" className="flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          <span className="text-base font-semibold text-blue-700 tracking-wide">
            ILAS
          </span>
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
          const active = location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition
                ${active
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              onClick={() => {
                window.scrollTo(0, 0);
                if (typeof onClose === "function") onClose();
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
            {user?.username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <div className="text-sm font-medium">
              {user?.username || "Guest"}
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {user?.role || "visitor"}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 w-full text-sm px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
        >
          <User size={14} /> Profile
        </button>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="flex items-center gap-2 w-full text-sm px-3 py-2 rounded-md text-red-600 hover:bg-red-50 mt-1"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </motion.aside>
  );
}
