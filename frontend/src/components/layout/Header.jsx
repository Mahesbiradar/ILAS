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
    <header className="bg-white fixed top-0 left-0 right-0 z-20 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between px-6 h-[72px] md:h-[56px]">
        {/* Sidebar Toggle (Mobile Only) */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 md:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Centered Header Title */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-blue-700 font-semibold text-lg text-center leading-tight">
            Innovative Library Automation System
          </h1>
          <p className="text-xs text-gray-500 text-center">
            Dr. Ambedkar Institute of Technology, Bangalore
          </p>
        </div>

        {/* Right Side - Notifications and User Menu */}
        <div className="flex items-center gap-4 relative" ref={menuRef}>
          <button
            className="p-2 rounded-md hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>

          {/* User Avatar */}
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100"
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium">{user?.username || "Guest"}</div>
              <div className="text-xs text-gray-500 uppercase">{user?.role || "visitor"}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {openMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-1/2 translate-x-1/2 mt-3 w-44 bg-white rounded-lg shadow-md border border-gray-100 py-2 text-sm"
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
