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

  if (!categories.length)
    return <p className="text-sm text-gray-500">No categories found.</p>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
      {categories.map((c) => {
        const id = c.slug || c.id || c.name;
        const name = c.name || c.title || c;

        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className="
              group
              flex flex-col items-center justify-center 
              h-32 sm:h-36
              rounded-xl 
              bg-white/90 backdrop-blur 
              shadow-sm 
              border border-gray-100 
              hover:shadow-lg 
              hover:-translate-y-1 
              transition-all duration-300
            "
          >
            {/* Icon */}
            <div className="
              p-3 rounded-xl 
              bg-blue-50 
              group-hover:bg-blue-100 
              transition
            ">
              <BookOpen size={22} className="text-blue-600" />
            </div>

            {/* Category Title */}
            <div className="mt-3 text-center">
              <div className="font-semibold text-sm text-gray-800">
                {name}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
