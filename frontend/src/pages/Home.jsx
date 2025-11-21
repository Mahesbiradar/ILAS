import React from "react";
import AnnouncementSection from "../components/layout/home/AnnouncementSection";
import SearchBar from "../components/common/SearchBar";
import CategoryGrid from "../components/layout/home/CategoryGrid";
import FeaturedBooks from "../components/layout/home/FeaturedBooks";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const handleSearch = (query) => {
    if (!query.trim()) return;
    navigate(`/books?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* 🔔 Announcements */}
      <AnnouncementSection />

      {/* 🔍 Search */}
      <div className="mt-6">
        <SearchBar
          placeholder="Search books, authors, ISBN..."
          onSearch={handleSearch}
        />
      </div>

      {/* 📚 Categories */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Categories
        </h2>
        <CategoryGrid big />
      </div>

      {/* 🌟 Featured */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Featured Books
        </h2>
        <FeaturedBooks />
      </div>
    </div>
  );
}
