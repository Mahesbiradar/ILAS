// src/components/home/CategoryGrid.jsx
import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { getLibraryMeta } from "../../../api/libraryApi";
import { useNavigate } from "react-router-dom";

export default function CategoryGrid({ onSelect }) {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meta = await getLibraryMeta();
        const cats = meta.categories || meta.categories_list || meta || [];
        if (!mounted) return;
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (err) {
        console.warn("Failed to load categories:", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  const handleClick = (slug) => {
    if (onSelect) onSelect(slug);
    navigate(`/books?category=${encodeURIComponent(slug)}`);
  };

  if (!categories.length) return <p className="text-sm text-gray-500">No categories found.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((c) => {
        const id = c.slug || c.id || c.name;
        const name = c.name || c.title || c;
        const subtitle = c.description || c.subtitle || "";
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className="flex flex-col items-start p-3 rounded-lg shadow-sm hover:shadow-md transition bg-white border border-gray-100"
          >
            <div className="p-2 rounded-md bg-blue-50">
              <BookOpen size={18} className="text-blue-600" />
            </div>
            <div className="mt-3 text-left">
              <div className="font-semibold text-sm text-gray-800">{name}</div>
              {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
