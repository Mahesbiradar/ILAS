import React, { useState, useRef, useEffect } from "react";
import { Menu, Bell, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-full px-4 md:px-6">

        {/* Sidebar Toggle (Mobile) */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Title */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-sm md:text-base font-semibold text-blue-700 truncate">
            ILAS — Innovative Library Automation System
          </h1>
          <p className="hidden md:block text-xs text-gray-500">
            Dr. Ambedkar Institute of Technology, Bangalore
          </p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <button
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* User avatar */}
          <button
            onClick={() => setOpenMenu((s) => !s)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 focus:outline-none"
            aria-haspopup="true"
            aria-expanded={openMenu}
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {openMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-3 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-2 text-sm"
              >
                <button
                  onClick={() => {
                    setOpenMenu(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                >
                  <User size={15} /> Profile
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <LogOut size={15} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
