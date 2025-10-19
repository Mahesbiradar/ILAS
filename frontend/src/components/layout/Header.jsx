import React, { useState } from "react";
import { Menu, Search, Bell, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthProvider";

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 p-3 md:p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="relative hidden sm:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <Search size={16} className="text-gray-500 mr-2" />
            <input
              type="search"
              placeholder="Search books, authors..."
              className="bg-transparent outline-none text-sm w-56"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-md hover:bg-gray-100 hidden sm:inline-flex">
            <Bell size={18} />
          </button>

          <div className="relative">
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100"
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                {user?.username?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">{user?.username || "Guest"}</div>
                <div className="text-xs text-gray-500">{user?.role || "visitor"}</div>
              </div>
            </button>

            {openMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-44 bg-white shadow rounded border overflow-hidden"
              >
                <button
                  onClick={() => {
                    setOpenMenu(false);
                    navigate("/profile");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <User size={16} /> Profile
                </button>

                <button
                  onClick={() => {
                    setOpenMenu(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
