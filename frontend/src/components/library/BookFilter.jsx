import React from "react";

export default function BookFilter({ search, setSearch, category, setCategory }) {
  return (
    <div className="flex flex-wrap gap-3 mb-6 justify-between items-center bg-white p-4 rounded-md shadow-sm">
      {/* 🔍 Search Bar */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search books..."
        className="border p-2 rounded w-full sm:w-64 focus:ring-2 focus:ring-blue-400 outline-none"
      />

      {/* 📚 Category Dropdown */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 rounded focus:ring-2 focus:ring-blue-400 outline-none"
      >
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Telecommunication">Telecommunication</option>
        <option value="Embedded Systems">Embedded Systems</option>
        <option value="Programming">Programming</option>
        <option value="C & C++">C & C++</option>
        <option value="Python">Python</option>
        <option value="Engineering Mathematics">Engineering Mathematics</option>
        <option value="Signal Processing">Signal Processing</option>
        <option value="Networking">Networking</option>
        <option value="Microcontrollers">Microcontrollers</option>
        <option value="IoT">IoT (Internet of Things)</option>
        <option value="Project Management">Project Management</option>
      </select>
    </div>
  );
}
