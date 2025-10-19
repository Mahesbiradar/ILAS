import React, { useEffect, useState } from "react";
import api from "../../api/axios";

export default function BookFilter({ search, setSearch, category, setCategory }) {
  const [categories, setCategories] = useState([]);

  // optional: fetch distinct categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("books/");
        const uniqueCategories = [
          ...new Set(res.data.map((b) => b.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      } catch {
        console.warn("Could not load categories, using default list.");
        setCategories(["Science", "Technology", "Fiction"]);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="flex flex-wrap gap-3 mb-4 justify-between items-center">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Search books..."
        className="border p-2 rounded w-60"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">All Categories</option>
        {categories.map((c, i) => (
          <option key={i} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
