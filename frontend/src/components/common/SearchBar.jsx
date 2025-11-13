// src/components/common/SearchBar.jsx
import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

/**
 * Modern SearchBar component with debouncing
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
      <label htmlFor="search-bar" className="sr-only">Search</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          id="search-bar"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />
        <button
          type="button"
          onClick={() => onSearch && onSearch(value)}
          className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Search
        </button>
      </div>
    </div>
  );
}
