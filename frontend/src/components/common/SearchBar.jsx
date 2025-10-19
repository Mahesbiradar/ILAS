// src/components/common/SearchBar.jsx
import React, { useState, useEffect } from "react";

/**
 * Props:
 *  - placeholder (string)
 *  - onSearch (function) optional, receives (value)
 *
 * Debounces input to reduce API calls.
 */

export default function SearchBar({ placeholder = "Search...", onSearch }) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const id = setTimeout(() => {
      if (onSearch) onSearch(value);
    }, 350);
    return () => clearTimeout(id);
  }, [value, onSearch]);

  return (
    <div className="w-full">
      <label htmlFor="home-search" className="sr-only">Search books</label>
      <div className="relative">
        <input
          id="home-search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 bg-white rounded-md py-3 px-4 pr-12 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition"
        />
        <button
          type="button"
          onClick={() => onSearch && onSearch(value)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 text-sm"
        >
          Search
        </button>
      </div>
    </div>
  );
}
