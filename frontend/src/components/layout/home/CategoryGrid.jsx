// src/components/home/CategoryGrid.jsx
import React from "react";
import { BookOpen, Cpu, Code, Image } from "lucide-react";

/**
 * Category list — replace icons or images as desired.
 * If you want click navigation, pass an onSelect prop.
 */

const categories = [
  { id: "tech", name: "Technology", subtitle: "Programming, AI", color: "from-green-50 to-white" },
  { id: "science", name: "Science", subtitle: "Physics, Biology", color: "from-purple-50 to-white" },
  { id: "fiction", name: "Fiction", subtitle: "Novels & Stories", color: "from-yellow-50 to-white" },
  { id: "history", name: "History", subtitle: "Past & Culture", color: "from-red-50 to-white" },
  { id: "business", name: "Business", subtitle: "Management, Finance", color: "from-indigo-50 to-white" },
  { id: "kids", name: "Kids", subtitle: "Children books", color: "from-pink-50 to-white" },
];

export default function CategoryGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect && onSelect(c.id)}
          className="flex flex-col items-start p-4 rounded-lg shadow-sm hover:shadow-md transition bg-gradient-to-b border border-gray-100"
        >
          <div className="p-2 rounded-md bg-white/60">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div className="mt-3 text-left">
            <div className="font-semibold text-sm text-gray-800">{c.name}</div>
            <div className="text-xs text-gray-500">{c.subtitle}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
