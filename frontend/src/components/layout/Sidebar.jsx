import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Users, Repeat, Info, Menu, X, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar({ collapsed, onClose, user }) {
  const location = useLocation();

  const nav = [
    { to: "/", label: "Home", icon: <Home size={16} /> },
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/books", label: "Books", icon: <BookOpen size={16} /> },
    { to: "/members", label: "Members", icon: <Users size={16} />, admin: true },
    { to: "/transactions", label: "Transactions", icon: <Repeat size={16} />, admin: true },
    { to: "/about", label: "About", icon: <Info size={16} /> },
  ];

  return (
    // motion.div for slide-in/out on mobile
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: collapsed ? 0 : -300 }}
      transition={{ type: "tween" }}
      className="fixed md:static z-30 left-0 top-0 bottom-0 w-64 bg-white border-r shadow-lg md:translate-x-0"
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen size={20} className="text-blue-600" />
            <span className="text-xl font-bold text-blue-700">ILAS</span>
          </Link>

          <button
            className="md:hidden p-1 rounded hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {nav.map((item) => {
            if (item.admin && (!user || user.role !== "admin")) return null;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-blue-50 transition
                  ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-700"}`}
                onClick={() => {
                  // scroll to top & close on mobile
                  window.scrollTo(0, 0);
                  if (typeof onClose === "function") onClose();
                }}
              >
                <span className="text-gray-500">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="text-xs text-gray-500 mb-1">Signed in as</div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <div className="text-sm font-medium">{user?.username || "Guest"}</div>
              <div className="text-xs text-gray-500">{user?.role || "visitor"}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
