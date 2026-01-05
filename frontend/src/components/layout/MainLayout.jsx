import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthProvider";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading } = useAuth();

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-800">
      {/* Sidebar (fixed on desktop) */}
      <aside className="hidden md:flex h-full">
        <Sidebar
          collapsed={true}
          user={user}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Mobile Overlay Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-30">
          <Sidebar
            collapsed={sidebarOpen}
            user={user}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <Header onToggleSidebar={() => setSidebarOpen((s) => !s)} />

        {/* Page Body */}
        <main
          className="flex-1 overflow-y-auto px-6 py-8 mt-[88px] md:mt-[56px] bg-gray-50"
          style={{
            boxShadow: "inset 0px 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-3 text-center text-[11px] text-gray-500 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
            <span>
              © {new Date().getFullYear()} ILAS — Innovative Library Automation System
            </span>
            <span className="hidden md:inline">|</span>
            <a
              href="mailto:ilasdrait@gmail.com"
              className="text-blue-600 hover:underline"
            >
              ilasdrait@gmail.com
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
