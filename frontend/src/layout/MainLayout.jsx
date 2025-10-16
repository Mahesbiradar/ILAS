import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X, BookOpen, LayoutDashboard } from "lucide-react";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 z-20 bg-white shadow-md w-64 h-full transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300`}
      >
        <div className="p-5 flex justify-between items-center border-b">
          <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2">
            <BookOpen size={22} /> ILAS
          </h1>
          <button
            className="md:hidden text-gray-600 hover:text-blue-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="p-5 space-y-4 text-gray-700 font-medium">
          <Link
            to="/"
            className="block hover:text-blue-600 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            Home
          </Link>

          <Link
            to="/dashboard"
            className="block hover:text-blue-600 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex items-center gap-2">
              <LayoutDashboard size={18} /> Dashboard
            </span>
          </Link>

          <Link
            to="/books"
            className="block hover:text-blue-600 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            Books
          </Link>

          <Link
            to="/members"
            className="block hover:text-blue-600 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            Members
          </Link>

          <Link
            to="/transactions"
            className="block hover:text-blue-600 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            Transactions
          </Link>

          <Link
            to="/about"
            className="block hover:text-blue-600 transition-colors duration-200"
            onClick={() => setSidebarOpen(false)}
          >
            About
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-600 hover:text-blue-700"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Innovative Library Automation System
            </h2>
          </div>
          <button className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors">
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-gray-300 text-center py-3 mt-auto">
          <p className="text-sm">
            © {new Date().getFullYear()} ILAS — Innovative Library Automation System
          </p>
        </footer>
      </div>
    </div>
  );
}
