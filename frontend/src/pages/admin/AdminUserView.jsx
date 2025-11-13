import React, { useState } from "react";
import Home from "../Home";
import Books from "../Books";
import About from "../About";

export default function AdminUserView() {
  const [tab, setTab] = useState("home");

  const tabs = [
    { id: "home", label: "Home" },
    { id: "books", label: "Books" },
    { id: "about", label: "About" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin: User View</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded ${tab===t.id? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        {tab === "home" && <Home />}
        {tab === "books" && <Books />}
        {tab === "about" && <About />}
      </div>
    </div>
  );
}
