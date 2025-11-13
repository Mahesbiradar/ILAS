import React from "react";

export default function BookFilter({ search, setSearch, category, setCategory, categories = [] }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6 justify-between items-center bg-white p-4 rounded-md shadow-sm">
      {/* 🔍 Search Bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search books by title, author or ISBN"
        className="border p-2 rounded w-full sm:w-64 focus:ring-2 focus:ring-blue-400 outline-none"
        aria-label="Search books"
      />

      {/* 📚 Category Dropdown (dynamic) */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id || c.name} value={c.slug || c.name}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
