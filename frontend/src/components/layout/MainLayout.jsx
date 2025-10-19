import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthProvider";

/**
 * MainLayout - wraps pages with sidebar + header and content area.
 * Keeps responsive behaviour: sidebar collapses on mobile.
 */
export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  // Close sidebar on route change or when window is resized above md
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Sidebar (desktop: visible; mobile: toggled) */}
      <div className={`hidden md:block`}>
        <Sidebar collapsed={true} user={user} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile slide-in */}
      <div className={`${sidebarOpen ? "block" : "hidden"} md:hidden`}>
        <Sidebar collapsed={sidebarOpen} user={user} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content (right side) */}
      <div className="flex-1 flex flex-col min-h-screen">
        <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
        <footer className="bg-white border-t py-3 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} ILAS — Innovative Library Automation System
        </footer>
      </div>
    </div>
  );
}
